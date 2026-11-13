"""강의·학과·필터 조회 API. 학생/수강신청 쓰기 API는 후속 구현 대상입니다."""
import logging
from contextlib import closing

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor

from app.database import get_connection

app = FastAPI()
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
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


@app.get("/courses")
def get_courses():
    courses, schedules, exclusions = read_catalog_queries([
        '''SELECT oc.id, c.course_code AS "courseCode", c.title, c.category,
           c.course_type AS "courseType", c.credit, oc.section_no AS "sectionNo",
           oc.professor_name AS "professorName", oc.department_id AS "departmentId",
           d.college_name AS "collegeName", d.faculty_name AS "facultyName",
           d.major_name AS "majorName", c.general_education_area AS "generalEducationArea",
           c.general_education_elective_area AS "generalEducationElectiveArea",
           c.classification_path AS "classificationPath", oc.target_grade AS "targetGrade",
           oc.is_online AS "isOnline", ss.capacity,
           ss.enrolled_count AS "enrolledCount", ss.remaining_seats AS "remainingSeats"
           FROM demo_course_registration.open_courses oc
           JOIN demo_course_registration.courses c ON c.course_code=oc.course_code
           JOIN demo_course_registration.departments d ON d.id=oc.department_id
           JOIN demo_course_registration.course_seat_status ss ON ss.open_course_id=oc.id
           ORDER BY oc.id''',
        '''SELECT id, day_of_week AS "dayOfWeek", start_period AS "startPeriod",
           end_period AS "endPeriod", classroom, open_course_id AS "openCourseId"
           FROM demo_course_registration.course_schedules ORDER BY id''',
        '''SELECT open_course_id AS "openCourseId", department_id AS "departmentId"
           FROM demo_course_registration.course_excluded_departments ORDER BY open_course_id, department_id''',
    ])
    schedules_by_course = {}
    exclusions_by_course = {}
    for schedule in schedules:
        schedules_by_course.setdefault(schedule["openCourseId"], []).append(schedule)
    for restriction in exclusions:
        exclusions_by_course.setdefault(restriction["openCourseId"], []).append(restriction["departmentId"])
    for course in courses:
        course["schedules"] = schedules_by_course.get(course["id"], [])
        course["excludedDepartmentIds"] = exclusions_by_course.get(course["id"], [])
        course["isFull"] = course["remainingSeats"] <= 0
    return courses


@app.get("/departments")
def get_departments():
    return read_catalog_queries([
        '''SELECT id, college_name AS "collegeName", faculty_name AS "facultyName", major_name AS "majorName"
           FROM demo_course_registration.departments ORDER BY id'''
    ])[0]


@app.get("/filter-categories")
def get_filter_categories():
    return read_catalog_queries([
        '''SELECT id, name, parent_id AS "parentId", is_fixed AS "isFixed", field, value, child_fields AS "childFields"
           FROM demo_course_registration.filter_categories ORDER BY id'''
    ])[0]
