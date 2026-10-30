"""수강신청 API. 학생 식별자는 요청 본문 대신 검증된 세션에서 가져옵니다."""

from typing import Literal
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field


class EnrollmentChange(BaseModel):
    courseIds: list[int] = Field(max_length=100)
    action: Literal["add", "cancel", "replace"] = "add"


def install_enrollments(app, db, claims, get_catalog):
    def student_session(c=Depends(claims)):
        if c.get("role") != "student":
            raise HTTPException(403, "학생 세션이 필요합니다.")
        return c

    @app.get("/api/enrollments")
    async def get_enrollments(c=Depends(student_session)):
        result = await db("POST", "rpc/tt_enrollment_state", {"p_owner": c["sub"]})
        if not result.get("studentId"):
            raise HTTPException(404, "학생 정보가 없습니다.")
        return result

    @app.post("/api/enrollments")
    async def change_enrollments(body: EnrollmentChange, c=Depends(student_session)):
        if any(isinstance(x, bool) or x < 1 for x in body.courseIds):
            raise HTTPException(422, "강좌 ID가 올바르지 않습니다.")
        return await db(
            "POST",
            "rpc/tt_apply_enrollments",
            {
                "p_owner": c["sub"],
                "p_course_ids": body.courseIds,
                "p_action": body.action,
            },
        )
