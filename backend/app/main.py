"""강의·학과·필터·공지 조회 API. 학생/수강신청 쓰기 API는 후속 구현 대상입니다."""
import logging
import os
import time
from threading import Lock
from contextlib import closing

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse, Response
from psycopg2 import IntegrityError
from psycopg2.extras import RealDictCursor, Json

from app.database import get_connection
from app.excel import parse_excel
from app.models import DepartmentImport, Course, Student
from app.auth import install_auth
from app.session import token, claims
from app.student_db import student_query
from app.syllabi import install_syllabi
from starlette.concurrency import run_in_threadpool

app = FastAPI()
logger = logging.getLogger(__name__)


def cors_origins():
    defaults = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://course-recommendation-timetable.vercel.app",
        "https://course-recommendation-timetable-fczu2l407-dustljhs-projects.vercel.app",
    ]
    configured = os.getenv("CORS_ORIGINS", "").split(",")
    return list(dict.fromkeys(
        origin.strip().rstrip("/") for origin in defaults + configured
        if origin.strip() and origin.strip() != "*"
    ))


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Hello World"}


def read_catalog_queries(queries):
    try:
        with closing(get_connection()) as conn:
            with conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    results = []
                    for query in queries:
                        cursor.execute(query)
                        results.append([dict(row) for row in cursor.fetchall()])
                    return results
    except Exception as error:
        logger.error("Catalog query failed (%s)", type(error).__name__)
        raise HTTPException(status_code=503, detail="DB 조회에 실패했습니다. 백엔드 DB 설정을 확인하세요.") from None


CATALOG_CACHE_SECONDS = float(os.getenv("CATALOG_CACHE_SECONDS", "2"))
_catalog_cache = {"data": None, "body": None, "at": 0.0}
_catalog_lock = Lock()


def _catalog_fresh():
    return (_catalog_cache["body"] is not None
            and time.monotonic() - _catalog_cache["at"] < CATALOG_CACHE_SECONDS)


def clear_catalog_cache():
    with _catalog_lock:
        _catalog_cache.update(data=None, body=None, at=0.0)


def _refresh_catalog():
    data = get_courses()
    body = JSONResponse(jsonable_encoder(data)).body
    _catalog_cache.update(data=data, body=body, at=time.monotonic())
    return data


def fresh_courses():
    with _catalog_lock:
        return _refresh_catalog()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/courses")
@app.get("/api/courses")
def courses():
    if CATALOG_CACHE_SECONDS <= 0:
        return get_courses()
    with _catalog_lock:
        if not _catalog_fresh():
            _refresh_catalog()
        body = _catalog_cache["body"]
    return Response(body, media_type="application/json")


def get_courses():
    courses, schedules = read_catalog_queries([
        '''SELECT oc.id, c."courseCode", c.title, c.credit,
           oc."classificationPath"[1] AS category,
           oc."classificationPath"[2] AS "courseType",
           oc."classificationPath"[3] AS "generalEducationArea",
           oc."classificationPath"[4] AS "generalEducationElectiveArea",
           oc."sectionNo", oc."professorName", oc."departmentId",
           d."collegeName", d."facultyName", d."majorName",
           oc."classificationPath", oc."excludedDepartmentIds",
           oc."syllabusPath", oc."syllabusName",
           oc."targetGrade", oc."isOnline", ss.capacity,
           ss."enrolledCount", ss."remainingSeats"
           FROM public.tt_open_courses oc
           JOIN public.tt_courses c ON c."courseCode"=oc."courseCode"
           JOIN public.tt_departments d ON d.id=oc."departmentId"
           JOIN public.tt_course_seats ss ON ss."openCourseId"=oc.id
           WHERE oc.active
           ORDER BY oc.id''',
        '''SELECT s.id, s."dayOfWeek", s."startPeriod", s."endPeriod",
           s.classroom, s."openCourseId"
           FROM public.tt_schedules s
           JOIN public.tt_open_courses oc ON oc.id=s."openCourseId"
           WHERE oc.active ORDER BY s.id''',
    ])
    schedules_by_course = {}
    for schedule in schedules:
        schedules_by_course.setdefault(schedule["openCourseId"], []).append(schedule)
    for course in courses:
        course["schedules"] = schedules_by_course.get(course["id"], [])
        course["excludedDepartmentIds"] = course.get("excludedDepartmentIds") or []
        course["isFull"] = course["remainingSeats"] <= 0
    return courses


@app.get("/api/notices")
def get_notices():
    return read_catalog_queries([
        '''SELECT id, title, content, author, is_pinned, created_at
           FROM public.notice
           ORDER BY is_pinned DESC NULLS LAST, created_at DESC, id DESC'''
    ])[0]


@app.get("/departments")
def get_departments():
    return read_catalog_queries([
        '''SELECT id, "collegeName", "facultyName", "majorName"
           FROM public.tt_departments ORDER BY id'''
    ])[0]


def save_import(items, *, departments=False, replace_all=True, edit_id=None):
    """Commit the complete validated sheet atomically; never partially apply it."""
    try:
        with closing(get_connection()) as conn:
            with conn:
                with conn.cursor() as cursor:
                    if departments:
                        cursor.executemany(
                            '''INSERT INTO public.tt_departments
                               (id, "collegeName", "facultyName", "majorName")
                               VALUES (%s, %s, %s, %s)
                               ON CONFLICT (id) DO UPDATE SET
                               "collegeName"=EXCLUDED."collegeName",
                               "facultyName"=EXCLUDED."facultyName",
                               "majorName"=EXCLUDED."majorName"''',
                            [(d["id"], d.get("collegeName") or None,
                              d.get("facultyName") or None, d["majorName"]) for d in items],
                        )
                    else:
                        cursor.execute('SELECT id FROM public.tt_departments')
                        known = {row[0] for row in cursor.fetchall()}
                        requested = {d["departmentId"] for d in items}
                        requested.update(i for d in items for i in d["excludedDepartmentIds"])
                        if not requested <= known:
                            raise HTTPException(422, "등록되지 않은 학과코드가 있습니다. 학과 엑셀을 먼저 적용하세요.")
                        cursor.execute('SELECT public.tt_save_catalog(%s::jsonb, %s, %s)',
                                       (Json(items), replace_all, edit_id))
    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(422, "DB 제약조건에 맞지 않는 데이터가 있습니다. 시트는 적용되지 않았습니다.") from None
    except Exception as error:
        logger.error("Catalog import failed (%s)", type(error).__name__)
        raise HTTPException(503, "DB 저장에 실패했습니다. 시트는 적용되지 않았습니다.") from None
    clear_catalog_cache()


@app.post("/api/admin/courses-import")
async def import_courses(file: UploadFile = File(...)):
    from starlette.concurrency import run_in_threadpool

    try:
        data = await file.read(5 * 1024 * 1024 + 1)
    finally:
        await file.close()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "5MB 이하의 엑셀만 업로드하세요.")
    try:
        items = await run_in_threadpool(parse_excel, data)
        if not items:
            raise ValueError("적용할 과목이 없습니다.")
    except Exception as error:
        raise HTTPException(422, f"엑셀 검증 실패: {error}") from None
    await run_in_threadpool(save_import, items)
    return {"savedCount": len(items)}


@app.post("/api/admin/departments-import")
def import_departments(body: DepartmentImport):
    save_import([item.model_dump() for item in body.items], departments=True)
    return {"savedCount": len(body.items)}


@app.post("/api/admin/courses")
def create_course(body: Course):
    save_import([body.model_dump()], replace_all=False, edit_id=0)
    return fresh_courses()


@app.put("/api/admin/courses/{course_id}")
def update_course(course_id: int, body: Course):
    if course_id < 1:
        raise HTTPException(422, "유효한 강좌 ID가 필요합니다.")
    save_import([body.model_dump()], replace_all=False, edit_id=course_id)
    return fresh_courses()


@app.delete("/api/admin/courses/{course_id}")
def delete_course(course_id: int):
    try:
        with closing(get_connection()) as conn:
            with conn:
                with conn.cursor() as cursor:
                    cursor.execute('SELECT public.tt_delete_course(%s)', (course_id,))
    except Exception as error:
        logger.error("Course deletion failed (%s)", type(error).__name__)
        raise HTTPException(503, "과목 삭제에 실패했습니다.") from None
    clear_catalog_cache()
    return fresh_courses()


def syllabus_query(method, course_id, body=None):
    try:
        with closing(get_connection()) as conn:
            with conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    if method == "GET":
                        cursor.execute('''SELECT id, "syllabusPath", "syllabusName"
                                          FROM public.tt_open_courses WHERE id=%s''', (course_id,))
                    else:
                        cursor.execute('''UPDATE public.tt_open_courses SET
                                          "syllabusPath"=%s, "syllabusName"=%s WHERE id=%s
                                          RETURNING id, "syllabusPath", "syllabusName"''',
                                       (body["syllabusPath"], body["syllabusName"], course_id))
                    rows = [dict(row) for row in cursor.fetchall()]
                    if method != "GET" and not rows:
                        raise HTTPException(404, "강좌를 찾을 수 없습니다.")
        if method != "GET":
            clear_catalog_cache()
        return rows
    except HTTPException:
        raise
    except Exception as error:
        logger.error("Syllabus query failed (%s)", type(error).__name__)
        raise HTTPException(503, "강의계획서 정보를 DB에서 처리하지 못했습니다.") from None


async def syllabus_db(method, table, body=None, params=None):
    # Adapter for the existing syllabus module's narrow GET/PATCH contract.
    if table != "tt_open_courses" or method not in {"GET", "PATCH"}:
        raise ValueError("Unsupported syllabus query")
    course_id = int(params["id"].removeprefix("eq."))
    return await run_in_threadpool(syllabus_query, method, course_id, body)


install_syllabi(app, syllabus_db)


@app.get("/filter-categories")
def get_filter_categories():
    # There is no filter table: derive classifications from active courses.
    rows = read_catalog_queries([
        '''SELECT DISTINCT "classificationPath" FROM public.tt_open_courses
           WHERE active ORDER BY "classificationPath"'''
    ])[0]
    categories = []
    ids = {}
    for row in rows:
        path = row["classificationPath"] or []
        for depth, name in enumerate(path):
            key = tuple(path[:depth + 1])
            if key in ids:
                continue
            node_id = len(ids) + 1
            ids[key] = node_id
            node = {"id": node_id, "name": name, "value": name,
                    "field": "category" if depth == 0 else f"classificationPath.{depth}"}
            if depth:
                node["parentId"] = ids[key[:-1]]
            if depth == 1 and path[0] == "전공":
                node["childFields"] = ["collegeName", "facultyName", "majorName"]
            elif depth == 1 and path[0] == "마이크로디그리":
                node["childFields"] = ["majorName"]
            categories.append(node)
    # Fixed UI filters have no separate persistence in the current schema.
    next_id = len(ids) + 1
    for name, field, options in [
        ("학년", "targetGrade", [(f"{n}학년", n) for n in range(1, 5)]),
        ("요일", "schedules.dayOfWeek", [(day, day) for day in "월화수목금토일"]),
        ("수업 형태", "isOnline", [("대면", False), ("온라인", True)]),
    ]:
        parent_id = next_id
        categories.append({"id": parent_id, "name": name, "isFixed": True})
        next_id += 1
        for label, value in options:
            categories.append({"id": next_id, "name": label, "parentId": parent_id,
                               "field": field, "value": value})
            next_id += 1
    return categories


@app.post("/api/students")
async def save_student(body: Student, c=Depends(claims)):
    if c["role"] != "student":
        raise HTTPException(403, "학생 세션이 필요합니다.")
    rows = await db("GET", "tt_students", params={"owner": f'eq.{c["sub"]}'})
    if not rows:
        raise HTTPException(404, "학생 정보가 없습니다.")
    if rows[0]["studentId"] != body.studentId:
        raise HTTPException(403, "학번은 변경할 수 없습니다.")
    if body.departmentId not in {d["id"] for d in await departments()}:
        raise HTTPException(422, "학과코드 오류")
    await db("PATCH", "tt_students", body.model_dump(), {"owner": f'eq.{c["sub"]}'})
    return {"token": token("student", c["sub"]), "student": body.model_dump()}


@app.get("/api/students/me")
async def me(c=Depends(claims)):
    if c["role"] != "student":
        raise HTTPException(403, "학생 세션이 필요합니다.")
    rows = await db("GET", "tt_students", params={"owner": f'eq.{c["sub"]}'})
    if not rows:
        raise HTTPException(404, "학생 정보가 없습니다.")
    return Student.model_validate(rows[0]).model_dump()




async def db(*args, **kwargs):
    return await run_in_threadpool(student_query, *args, **kwargs)


async def auth_db(*args, **kwargs):
    return await db(*args, **kwargs)


async def departments():
    return await db("GET", "tt_departments", params={"order": "id"})


install_auth(app, auth_db, token, departments)
