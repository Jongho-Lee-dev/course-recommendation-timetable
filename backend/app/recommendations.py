"""Gemini-backed timetable recommendations; the endpoint does not query the DB."""
import json
import logging
import os
import time
from collections import defaultdict, deque
from threading import Lock

import httpx
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ScheduleInput(BaseModel):
    dayOfWeek: str = Field(min_length=1, max_length=3)
    startPeriod: int = Field(ge=1, le=30)
    endPeriod: int = Field(ge=1, le=30)


class CourseInput(BaseModel):
    id: int = Field(gt=0)
    courseCode: str = Field(max_length=40)
    title: str = Field(min_length=1, max_length=200)
    category: str = Field(default="", max_length=80)
    credit: float = Field(gt=0, le=30)
    isOnline: bool = False
    schedules: list[ScheduleInput] = Field(default_factory=list, max_length=30)


class RecommendationPreferences(BaseModel):
    credits: float = Field(ge=1, le=50)
    majorOnly: bool = False
    online: bool = False
    avoidMorning: bool = False
    major: str | None = Field(default=None, max_length=120)


class RecommendationRequest(BaseModel):
    courses: list[CourseInput] = Field(min_length=1, max_length=100)
    preferences: RecommendationPreferences
    selectedCourseIds: list[int] = Field(default_factory=list, max_length=100)


_requests: dict[str, deque[float]] = defaultdict(deque)
_rate_lock = Lock()


def _rate_limit(request: Request):
    now = time.monotonic()
    address = request.client.host if request.client else "unknown"
    with _rate_lock:
        recent = _requests[address]
        while recent and now - recent[0] > 60:
            recent.popleft()
        if len(recent) >= 8:
            raise HTTPException(429, "요청이 많습니다. 잠시 후 다시 시도하세요.")
        recent.append(now)


def _overlap(a: ScheduleInput, b: ScheduleInput) -> bool:
    return (a.dayOfWeek == b.dayOfWeek and a.startPeriod <= b.endPeriod
            and a.endPeriod >= b.startPeriod)


def _validate_recommendation(ids, reason, courses, preferences):
    by_id = {course.id: course for course in courses}
    chosen = []
    for course_id in ids:
        if not isinstance(course_id, int) or isinstance(course_id, bool):
            continue
        course = by_id.get(course_id)
        if course is None or course in chosen:
            continue
        if preferences.majorOnly and course.category != "전공":
            continue
        if not preferences.online and course.isOnline:
            continue
        if preferences.avoidMorning and any(s.startPeriod <= 2 for s in course.schedules):
            continue
        if sum(c.credit for c in chosen) + course.credit > preferences.credits:
            continue
        if any(not course.isOnline and not other.isOnline and
               any(_overlap(a, b) for a in course.schedules for b in other.schedules)
               for other in chosen):
            continue
        chosen.append(course)
    return {"courseIds": [c.id for c in chosen], "reason": reason[:500]}


async def _generate(body: RecommendationRequest):
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise HTTPException(503, "백엔드 GEMINI_API_KEY 환경변수를 설정하세요.")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    if not model or any(ch in model for ch in "/?#"):
        raise HTTPException(503, "GEMINI_MODEL 설정을 확인하세요.")

    prefs = body.preferences
    candidates = [course for course in body.courses if
        (not prefs.majorOnly or course.category == "전공") and
        (prefs.online or not course.isOnline) and
        (not prefs.avoidMorning or not any(s.startPeriod <= 2 for s in course.schedules))]
    if not candidates:
        raise HTTPException(422, "조건에 맞는 추천 대상 과목이 없습니다.")
    if len({c.id for c in candidates}) != len(candidates):
        raise HTTPException(422, "과목 ID가 중복되었습니다.")

    response_schema = {
        "type": "OBJECT", "properties": {"recommendations": {
            "type": "ARRAY", "minItems": 1, "maxItems": 3, "items": {
                "type": "OBJECT", "properties": {
                    "courseIds": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                    "reason": {"type": "STRING"},
                }, "required": ["courseIds", "reason"],
            }}}, "required": ["recommendations"],
    }
    prompt = {
        "task": "Build up to three distinct, valid university timetables from the supplied courses.",
        "rules": ["Use only supplied course IDs.", "Do not exceed the credit target.",
                  "Do not schedule overlapping in-person courses.",
                  "Follow all preference flags.", "Explain briefly in Korean."],
        "preferences": prefs.model_dump(),
        "alreadySelectedCourseIds": body.selectedCourseIds,
        "courses": [course.model_dump() for course in candidates],
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {"contents": [{"parts": [{"text": json.dumps(prompt, ensure_ascii=False)}]}],
               "generationConfig": {"responseMimeType": "application/json",
                                    "responseSchema": response_schema,
                                    "maxOutputTokens": 4096}}
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, headers={"x-goog-api-key": key}, json=payload)
    except httpx.TimeoutException:
        raise HTTPException(504, "AI 응답 시간이 초과되었습니다. 다시 시도하세요.") from None
    except httpx.RequestError as error:
        logger.warning("Gemini request failed (%s)", type(error).__name__)
        raise HTTPException(502, "AI 서비스에 연결하지 못했습니다.") from None
    if response.is_error:
        logger.warning("Gemini returned HTTP %s", response.status_code)
        if response.status_code in (401, 403):
            raise HTTPException(502, "Gemini API 키 또는 사용 권한을 확인하세요.")
        if response.status_code == 429:
            raise HTTPException(503, "Gemini 사용 한도에 도달했습니다. 잠시 후 다시 시도하세요.")
        raise HTTPException(502, "Gemini가 추천을 생성하지 못했습니다.")
    try:
        data = response.json()
        text = "".join(part.get("text", "") for part in
                       data["candidates"][0]["content"]["parts"])
        generated = json.loads(text)
        raw = generated["recommendations"]
        if not isinstance(raw, list) or not raw:
            raise ValueError("empty recommendations")
    except (ValueError, KeyError, TypeError, IndexError):
        logger.warning("Gemini returned an invalid recommendation payload")
        raise HTTPException(502, "AI 응답 형식을 확인하지 못했습니다. 다시 시도하세요.") from None

    recommendations = []
    seen = set()
    for item in raw[:3]:
        if not isinstance(item, dict) or not isinstance(item.get("courseIds"), list):
            continue
        reason = item.get("reason")
        if not isinstance(reason, str):
            reason = "조건에 맞춰 구성한 시간표입니다."
        result = _validate_recommendation(item["courseIds"],
            reason, candidates, prefs)
        signature = tuple(result["courseIds"])
        if signature and signature not in seen:
            seen.add(signature)
            recommendations.append(result)
    if not recommendations:
        raise HTTPException(502, "조건에 맞는 AI 추천 결과를 만들지 못했습니다. 조건을 완화해 보세요.")
    return {"recommendations": recommendations, "provider": "gemini"}


def install_recommendations(app: FastAPI):
    @app.post("/api/recommendations")
    async def recommendations(body: RecommendationRequest, request: Request):
        _rate_limit(request)
        return await _generate(body)
