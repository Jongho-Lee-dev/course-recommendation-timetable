"""본인 확인한 기존 학생의 비밀번호 설정: python -m app.set_student_password 학번"""

import asyncio
import getpass
import sys
from .main import db
from .auth import password_hash


async def run(student_id, password):
    rows = await db(
        "GET",
        "tt_students",
        params={"studentId": f"eq.{student_id}", "select": "owner"},
    )
    if not rows:
        raise SystemExit("등록된 학번이 없습니다.")
    await db(
        "PATCH",
        "tt_students",
        {"passwordHash": await asyncio.to_thread(password_hash, password)},
        {"owner": f'eq.{rows[0]["owner"]}'},
    )
    print("비밀번호 설정 완료. 기존 학생 정보와 신청내역은 유지됩니다.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("사용법: python -m app.set_student_password 학번")
    password = getpass.getpass("새 비밀번호 (8~128자): ")
    if not 8 <= len(password) <= 128:
        raise SystemExit("비밀번호 길이를 확인하세요.")
    if password != getpass.getpass("비밀번호 확인: "):
        raise SystemExit("비밀번호가 일치하지 않습니다.")
    asyncio.run(run(sys.argv[1], password))
