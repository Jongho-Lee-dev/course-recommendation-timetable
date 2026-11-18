"""Gemini chat endpoint for the signed-in academic assistant; no DB access."""
import logging
import os
import re
import time
from collections import defaultdict, deque
from threading import Lock

import httpx
from fastapi import FastAPI, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from app.session import claims

logger = logging.getLogger(__name__)
_requests: dict[str, deque[float]] = defaultdict(deque)
_rate_lock = Lock()


class ChatTurn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    text: str = Field(min_length=1, max_length=2000)


class ChatStudent(BaseModel):
    name: str = Field(default="학생", max_length=80)
    major: str | None = Field(default=None, max_length=120)
    grade: int | None = Field(default=None, ge=1, le=10)
    completedCredits: float | None = Field(default=None, ge=0, le=500)
    maxCredits: float | None = Field(default=None, ge=1, le=50)


class ChatRequest(BaseModel):
    messages: list[ChatTurn] = Field(min_length=1, max_length=12)
    student: ChatStudent = Field(default_factory=ChatStudent)


def _rate_limit(request: Request):
    now = time.monotonic()
    address = request.client.host if request.client else "unknown"
    with _rate_lock:
        recent = _requests[address]
        while recent and now - recent[0] > 60:
            recent.popleft()
        if len(recent) >= 12:
            raise HTTPException(429, "질문이 잠시 몰리고 있어요. 잠시 후 다시 보내주세요.")
        recent.append(now)


def _needs_catalog(question: str) -> bool:
    return any(term in question for term in (
        "전공", "과목", "강의", "수업", "개설", "교수", "학과", "시간표",
        "시간대", "시간", "요일", "교시", "정원", "추천", "수강",
    ))


def _select_courses(courses, question: str, major: str | None):
    stopwords = {"알려줘", "뭐있어", "뭐가", "추천해", "추천하는", "시간대",
                 "수업시간", "전공과목", "강의시간", "과목시간"}
    terms = [term for term in re.findall(r"[가-힣A-Za-z0-9]{2,}", question)
             if term not in stopwords]
    ranked = []
    for course in courses:
        classification = " ".join(course.get("classificationPath") or [])
        major_match = bool(major and course.get("majorName") == major)
        is_major = course.get("category") == "전공" or "전공" in classification
        searchable = " ".join(str(course.get(field) or "") for field in (
            "title", "courseCode", "category", "courseType", "majorName",
            "facultyName", "collegeName", "professorName",
        )) + " " + classification
        title = str(course.get("title", ""))
        score = (5 if major_match else 0) + (2 if is_major else 0)
        score += sum(3 if term in title else 1 if term in searchable else 0 for term in terms)
        ranked.append((score, major_match, is_major, course))

    specific_match = bool(terms) and any(score >= 3 for score, *_ in ranked)
    if specific_match:
        ranked = [item for item in ranked if item[0] >= 3]
    elif major:
        major_courses = [item for item in ranked if item[1] and item[2]]
        ranked = major_courses or [item for item in ranked if item[2]]
    elif any(term in question for term in ("전공", "시간표", "추천")):
        ranked = [item for item in ranked if item[2]]

    ranked.sort(key=lambda item: (-item[0], item[3].get("title", ""), item[3].get("id", 0)))
    return [{
        "id": course.get("id"),
        "courseCode": course.get("courseCode"),
        "title": course.get("title"),
        "category": course.get("category"),
        "credit": course.get("credit"),
        "majorName": course.get("majorName"),
        "professorName": course.get("professorName"),
        "isOnline": course.get("isOnline"),
        "remainingSeats": course.get("remainingSeats"),
        "schedules": [{
            "dayOfWeek": schedule.get("dayOfWeek"),
            "startPeriod": schedule.get("startPeriod"),
            "endPeriod": schedule.get("endPeriod"),
            "classroom": schedule.get("classroom"),
        } for schedule in course.get("schedules", [])],
    } for _, _, _, course in ranked[:30]]


async def _ask_gemini(body: ChatRequest, catalog_status: str, catalog: list[dict]):
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise HTTPException(503, "백엔드 GEMINI_API_KEY 설정이 필요합니다.")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    if not model or any(ch in model for ch in "/?#"):
        raise HTTPException(503, "백엔드 GEMINI_MODEL 설정을 확인하세요.")
    if sum(len(turn.text) for turn in body.messages) > 8000:
        raise HTTPException(413, "대화가 너무 길어요. 새 대화를 시작해 주세요.")

    student = body.student
    context = [f"이름: {student.name}"]
    if student.major:
        context.append(f"전공: {student.major}")
    if student.grade is not None:
        context.append(f"학년: {student.grade}")
    if student.completedCredits is not None:
        context.append(f"현재 입력된 이수 학점: {student.completedCredits}")
    if student.maxCredits is not None:
        context.append(f"현재 입력된 학기 최대 신청 학점: {student.maxCredits}")

    system_prompt = (
            "당신은 한국 대학생을 돕는 친절한 한국어 학업 도우미입니다. "
            "수강 계획, 학점 관리, 시간표 구성, 사이트 사용법을 간결하고 실용적으로 안내하세요. "
            "아래 학생 정보는 사용자가 이 사이트에 입력한 참고 정보일 뿐이며, 모르는 사실을 추측해 단정하지 마세요. "
            "특정 과목의 개설 여부, 담당 교수, 정원, 요일과 교시는 제공된 DB 조회 결과만 사용하세요. "
            "전공 과목을 물으면 학생 전공에 맞는 과목명, 학수번호, 학점, 요일·교시를 정리하세요. "
            "시간표를 추천할 때는 DB에 있는 강좌와 실제 요일·교시만 사용하고 시간이 겹치는 수업은 함께 추천하지 마세요. "
            "온라인 강좌에는 고정 시간표가 없다고 알려주세요. DB 결과에 없는 과목이나 시간은 지어내지 마세요. "
            "개인별 공식 졸업요건은 단정하지 말고 학교 공식 학사 안내를 함께 확인하도록 안내하세요. "
            "학생의 비밀번호, API 키, 인증정보를 요청하지 마세요. 학생 정보: " + "; ".join(context)
    )
    if catalog_status == "available":
        system_prompt += "\nDB에서 조회한 질문 관련 강좌 목록(JSON): " + str(catalog)
        if not catalog:
            system_prompt += "\nDB 조회는 성공했지만 질문과 일치하는 강좌가 없습니다. 그 점을 정확히 안내하세요."
    elif catalog_status == "unavailable":
        system_prompt += "\n현재 DB 조회가 실패했습니다. 개설 강좌와 시간대를 확인할 수 없다고 안내하고 강좌나 시간을 추측하지 마세요."

    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{
            "role": "model" if turn.role == "assistant" else "user",
            "parts": [{"text": turn.text}],
        } for turn in body.messages],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048,
                             "thinkingConfig": {"thinkingBudget": 0}},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(url, headers={"x-goog-api-key": key}, json=payload)
    except httpx.TimeoutException:
        raise HTTPException(504, "AI 답변이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.") from None
    except httpx.RequestError as error:
        logger.warning("Gemini chat request failed (%s)", type(error).__name__)
        raise HTTPException(502, "AI 서비스에 연결하지 못했어요.") from None
    if response.is_error:
        logger.warning("Gemini chat returned HTTP %s", response.status_code)
        if response.status_code in (401, 403):
            raise HTTPException(502, "Gemini API 키 또는 사용 권한을 확인해 주세요.")
        if response.status_code == 429:
            raise HTTPException(503, "Gemini 사용 한도에 도달했어요. 잠시 후 다시 시도해 주세요.")
        raise HTTPException(502, "AI 답변을 만들지 못했어요. 잠시 후 다시 시도해 주세요.")
    try:
        data = response.json()
        parts = data["candidates"][0]["content"]["parts"]
        reply = "\n".join(part.get("text", "") for part in parts).strip()
        if not reply:
            raise ValueError("empty response")
    except (ValueError, KeyError, TypeError, IndexError):
        logger.warning("Gemini chat returned an empty or invalid response")
        raise HTTPException(502, "AI 답변 형식을 확인하지 못했어요. 다시 시도해 주세요.") from None
    return reply


def install_chat(app: FastAPI):
    @app.post("/api/chat")
    async def chat(body: ChatRequest, request: Request, session=Depends(claims)):
        if session.get("role") != "student":
            raise HTTPException(403, "학생 로그인이 필요합니다.")
        _rate_limit(request)
        latest_question = next((turn.text for turn in reversed(body.messages)
                                if turn.role == "user"), "")
        catalog_status = "not_requested"
        catalog = []
        if _needs_catalog(latest_question):
            try:
                from app.main import get_courses
                courses = await run_in_threadpool(get_courses)
                catalog = _select_courses(courses, latest_question, body.student.major)
                catalog_status = "available"
            except Exception as error:
                logger.warning("Chat catalog lookup failed (%s)", type(error).__name__)
                catalog_status = "unavailable"
        reply = await _ask_gemini(body, catalog_status, catalog)
        return {"reply": reply}
