
from database import get_connection

try:
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM demo_course_registration.open_courses"
            )
            count = cursor.fetchone()[0]

    print("Supabase DB 연결 성공!")
    print(f"개설 강의 수: {count}")

except Exception as e:
    print("DB 연결 실패:", e)
