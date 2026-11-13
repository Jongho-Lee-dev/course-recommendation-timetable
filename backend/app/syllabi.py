import logging
import os
from urllib.parse import quote
from uuid import uuid4

import httpx
from fastapi import File, HTTPException, UploadFile
from fastapi.responses import Response

BUCKET = "course-syllabi"
MAX_BYTES = 10 * 1024 * 1024
logger = logging.getLogger("uvicorn.error")


async def storage_request(method, path, **kwargs):
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        raise HTTPException(503, "Supabase 연결 정보를 설정하세요.")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        **kwargs.pop("headers", {}),
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(
                method, f"{url}/storage/v1/{path}", headers=headers, **kwargs
            )
    except httpx.RequestError:
        raise HTTPException(503, "강의계획서 저장소에 연결할 수 없습니다.")
    if response.is_error:
        raise HTTPException(
            502, "강의계획서 저장소 요청에 실패했습니다. Storage 설정을 확인하세요."
        )
    return response


async def remove_object(path):
    await storage_request("DELETE", f"object/{BUCKET}", json={"prefixes": [path]})


async def cleanup_object(path):
    try:
        await remove_object(path)
    except HTTPException:
        logger.warning("An unused syllabus object could not be cleaned up.")


def install_syllabi(app, db):
    async def get_course(course_id):
        rows = await db(
            "GET",
            "tt_open_courses",
            params={
                "id": f"eq.{course_id}",
                "select": "id,syllabusPath,syllabusName",
            },
        )
        if not rows:
            raise HTTPException(404, "강좌를 찾을 수 없습니다.")
        return rows[0]

    @app.put("/api/admin/courses/{course_id}/syllabus")
    async def upload_syllabus(course_id: int, file: UploadFile = File(...)):
        course = await get_course(course_id)
        try:
            content = await file.read(MAX_BYTES + 1)
        finally:
            await file.close()
        if len(content) > MAX_BYTES:
            raise HTTPException(413, "강의계획서는 10MB 이하만 업로드할 수 있습니다.")
        if not (file.filename or "").lower().endswith(".pdf") or not content.startswith(
            b"%PDF-"
        ):
            raise HTTPException(422, "PDF 파일만 업로드할 수 있습니다.")
        name = (
            (file.filename or "syllabus.pdf")
            .replace("\\", "/")
            .split("/")[-1][:200]
        )
        path = f"{course_id}/{uuid4().hex}.pdf"
        await storage_request(
            "POST",
            f"object/{BUCKET}/{path}",
            content=content,
            headers={"Content-Type": "application/pdf"},
        )
        try:
            await db(
                "PATCH",
                "tt_open_courses",
                {"syllabusPath": path, "syllabusName": name},
                params={"id": f"eq.{course_id}"},
            )
        except Exception:
            await cleanup_object(path)
            raise
        if course.get("syllabusPath"):
            await cleanup_object(course["syllabusPath"])
        return {"syllabusPath": path, "syllabusName": name}

    @app.delete("/api/admin/courses/{course_id}/syllabus")
    async def delete_syllabus(course_id: int):
        course = await get_course(course_id)
        await db(
            "PATCH",
            "tt_open_courses",
            {"syllabusPath": None, "syllabusName": None},
            params={"id": f"eq.{course_id}"},
        )
        if course.get("syllabusPath"):
            await cleanup_object(course["syllabusPath"])
        return {"syllabusPath": None, "syllabusName": None}

    @app.get("/api/courses/{course_id}/syllabus")
    async def read_syllabus(course_id: int):
        course = await get_course(course_id)
        path = course.get("syllabusPath")
        if not path:
            raise HTTPException(404, "등록된 강의계획서가 없습니다.")
        pdf = await storage_request(
            "GET", f"object/authenticated/{BUCKET}/{quote(path, safe='/')}"
        )
        name = quote(course.get("syllabusName") or "syllabus.pdf", safe="")
        return Response(
            pdf.content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename*=UTF-8''{name}",
                "X-Content-Type-Options": "nosniff",
                "Cache-Control": "no-store",
            },
        )
