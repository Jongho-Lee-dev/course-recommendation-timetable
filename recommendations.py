"""Student-specific timetable recommendations backed by Gemini."""
import json
import os
import re
from urllib.parse import quote

import httpx
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field


class RecommendationPreferences(BaseModel):
    credits: float = Field(gt=0, le=50)
    majorOnly: bool = False
    online: bool = False
    avoidMorning: bool = False


def _overlaps(a, b):
    if a.get("isOnline") or b.get("isOnline"):
        return False
    return any(
        x["dayOfWeek"] == y["dayOfWeek"]
        and x["startPeriod"] <= y["endPeriod"]
        and x["endPeriod"] >= y["startPeriod"]
        for x in a.get("schedules", [])
        for y in b.get("schedules", [])
    )


def _validate_plan(ids, by_id, prefs, department_id, credit_limit):
    """Keep only model-selected courses that satisfy hard enrollment constraints."""
    selected, seen_codes, credits = [], set(), 0.0
    for course_id in ids:
        if isinstance(course_id, bool) or not isinstance(course_id, int):
            continue
        course = by_id.get(course_id)
        if not course or course_id in {c["id"] for c in selected}:
            continue
        if department_id in course.get("excludedDepartmentIds", []):
            continue
        if (prefs.majorOnly and course.get("category") != "전공") or (not prefs.online and course.get("isOnline")):
            continue
        if prefs.avoidMorning and any(s["startPeriod"] <= 2 for s in course.get("schedules", [])):
            continue
        if course["courseCode"] in seen_codes or credits + course["credit"] > credit_limit:
            continue
        if any(_overlaps(course, existing) for existing in selected):
            continue
        selected.append(course)
        seen_codes.add(course["courseCode"])
        credits += course["credit"]
    return selected


def install_recommendations(app, db, claims, get_catalog):
    def student_session(c=Depends(claims)):
        if c.get("role") != "student":
            raise HTTPException(403, "학생 세션이 필요합니다.")
        return c

    @app.post("/api/recommendations")
    async def recommend(body: RecommendationPreferences, c=Depends(student_session)):
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key or api_key.startswith("YOUR-"):
            raise HTTPException(503, "AI 추천을 사용하려면 백엔드 GEMINI_API_KEY를 설정하세요.")

        students = await db("GET", "tt_students", params={"owner": f'eq.{c["sub"]}', "limit": "1"})
        if not students:
            raise HTTPException(404, "학생 정보가 없습니다.")
        student = students[0]
        credit_limit = min(float(student["maxCredits"]), body.credits)
        catalog = await get_catalog()
        candidates = [
            course for course in catalog
            if course.get("active", True)
            and course.get("remainingSeats", 1) > 0
            and student["departmentId"] not in course.get("excludedDepartmentIds", [])
            and (body.online or not course.get("isOnline"))
            and (not body.majorOnly or course.get("category") == "전공")
            and (not body.avoidMorning or not any(s["startPeriod"] <= 2 for s in course.get("schedules", [])))
        ]
        if not candidates:
            return {"recommendations": [], "message": "현재 조건에 맞는 개설 과목이 없습니다."}

        # Send only information needed to choose a timetable; never send name, student ID, or session data.
        compact_courses = [
            {"id": x["id"], "courseCode": x["courseCode"], "sectionNo": x["sectionNo"],
             "title": x["title"], "category": x["category"], "courseType": x.get("courseType", ""),
             "credit": x["credit"], "professorName": x["professorName"], "isOnline": x["isOnline"],
             "schedules": [{"dayOfWeek": s["dayOfWeek"], "startPeriod": s["startPeriod"], "endPeriod": s["endPeriod"]} for s in x.get("schedules", [])]}
            for x in candidates
        ]
        model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
        if not re.fullmatch(r"[A-Za-z0-9._-]+", model):
            raise HTTPException(503, "GEMINI_MODEL 설정을 확인하세요.")
        prompt = (
            "한국 대학생의 수강 시간표를 설계하는 도우미입니다. 제공된 과목 목록의 id만 사용해 서로 다른 시간표 후보를 최대 3개 만드세요. "
            "각 시간표는 같은 과목의 복수 분반을 포함하지 말고, 시간 충돌을 피하며, 목표 학점을 넘지 않아야 합니다. "
            "불가능한 조건을 억지로 채우지 말고 가능한 과목만 선택하세요. 이유는 과목 선택의 장점을 한국어 한 문장으로 설명하세요.\n"
            f"학생 조건: 학년 {student['grade']}, 이수 학점 {student['completedCredits']}, 졸업 기준 {student['graduationCredits']}, "
            f"학과코드 {student['departmentId']}, 이번 목표 학점 최대 {credit_limit}. "
            f"전공 중심={body.majorOnly}, 온라인 과목 허용={body.online}, 1~2교시 회피={body.avoidMorning}.\n"
            f"개설 과목 JSON: {json.dumps(compact_courses, ensure_ascii=False)}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.35,
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT", "required": ["recommendations"],
                    "properties": {"recommendations": {"type": "ARRAY", "maxItems": 3, "items": {
                        "type": "OBJECT", "required": ["courseIds", "reason"],
                        "properties": {"courseIds": {"type": "ARRAY", "items": {"type": "INTEGER"}}, "reason": {"type": "STRING"}}
                    }}}
                }
            }
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{quote(model, safe='')}:generateContent"
        try:
            response = await app.state.http.post(url, json=payload, headers={"x-goog-api-key": api_key})
            if response.is_error:
                raise HTTPException(502, "Gemini AI 요청에 실패했습니다. API 키와 모델 설정을 확인하세요.")
            result = response.json()
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            generated = json.loads(text)
        except HTTPException:
            raise
        except (httpx.RequestError, KeyError, IndexError, ValueError, TypeError):
            raise HTTPException(502, "AI 추천 결과를 읽지 못했습니다. 잠시 후 다시 시도하세요.")

        raw_recommendations = generated.get("recommendations") if isinstance(generated, dict) else None
        if not isinstance(raw_recommendations, list):
            raise HTTPException(502, "AI 추천 결과 형식이 올바르지 않습니다. 다시 시도하세요.")
        by_id = {x["id"]: x for x in candidates}
        recommendations = []
        for item in raw_recommendations[:3]:
            if not isinstance(item, dict) or not isinstance(item.get("courseIds"), list):
                continue
            chosen = _validate_plan(item.get("courseIds", []), by_id, body, student["departmentId"], credit_limit)
            if not chosen:
                continue
            recommendations.append({
                "courseIds": [x["id"] for x in chosen],
                "reason": str(item.get("reason", "조건에 맞는 시간표로 구성했습니다."))[:300],
            })
        return {"recommendations": recommendations, "message": None if recommendations else "조건을 만족하는 시간표를 만들지 못했습니다. 목표 학점이나 선호 조건을 조정해 보세요."}
