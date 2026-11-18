"""첨부 원본에서 SQL/JSON 시드를 재생성합니다. xlsx 출력은 별도 제공 파일 사용."""

import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.excel import parse_excel, HEADERS

ROOT = Path(__file__).resolve().parents[2]
source = ROOT / "과목 데이터.xlsx"
items = parse_excel(source.read_bytes())
original = len(items)
text = (ROOT / "frontend/src/shared/data/departments.ts").read_text()
departments = json.loads(text[text.index("[", text.index("= ")) : text.rindex("]") + 1])
new = [
    ("CS101", "컴퓨터개론", 1, 1),
    ("CS102", "C프로그래밍", 1, 1),
    ("CS202", "객체지향프로그래밍", 1, 2),
    ("CS203", "데이터베이스", 1, 2),
    ("CS204", "컴퓨터구조", 1, 2),
    ("CS301", "운영체제", 1, 3),
    ("CS302", "알고리즘", 1, 3),
    ("CS303", "컴퓨터네트워크", 1, 3),
    ("CS401", "캡스톤디자인", 1, 4),
    ("SW101", "파이썬프로그래밍", 2, 1),
    ("SW202", "웹프로그래밍", 2, 2),
    ("SW301", "백엔드프로그래밍", 2, 3),
    ("SW302", "모바일앱개발", 2, 3),
    ("AI101", "인공지능입문", 11, 1),
    ("AI201", "머신러닝", 11, 2),
    ("AI301", "딥러닝", 11, 3),
    ("DS201", "데이터분석", 12, 2),
    ("DS301", "빅데이터처리", 12, 3),
    ("IS201", "암호학기초", 13, 2),
    ("GE101", "대학영어", 10, 1),
    ("GE102", "글쓰기와소통", 10, 1),
    ("GE103", "음악의이해", 10, 1),
    ("GE104", "환경과사회", 10, 1),
    ("GE105", "생활속통계", 10, 1),
    ("GE106", "디지털사회와문화", 10, 1),
    ("GE107", "논리와비판적사고", 10, 1),
    ("GE108", "경제의이해", 10, 1),
    ("GE109", "세계문화", 10, 1),
]
for i, (code, title, dept, grade) in enumerate(new):
    if len(items) >= 40:
        break
    if any(c["courseCode"] == code for c in items):
        continue
    online = i % 5 == 0
    items.append(
        dict(
            courseCode=code,
            sectionNo="01",
            title=title,
            professorName=["김가람", "이서연", "박민준", "최지우", "정하늘"][i % 5],
            credit=3,
            capacity=30 + (i % 4) * 10,
            targetGrade=grade,
            departmentId=dept,
            isOnline=online,
            classificationPath=(
                ["교양", "교양 선택", "일반 교양"]
                if dept == 10
                else ["전공", "전공 필수" if i % 3 == 0 else "전공 선택"]
            ),
            excludedDepartmentIds=[],
            schedules=(
                []
                if online
                else [
                    dict(
                        dayOfWeek="월화수목금"[i % 5],
                        startPeriod=1 + (i % 4) * 2,
                        endPeriod=2 + (i % 4) * 2,
                        classroom=f"IT Hall {200+i}",
                    )
                ]
            ),
        )
    )
assert len(items) == 40
(ROOT / "backend/seed_courses.json").write_text(
    json.dumps(items, ensure_ascii=False, indent=2)
)
q = lambda x: "'" + str(x).replace("'", "''") + "'"
sql = [
    "-- 원본 엑셀 "
    + str(original)
    + "개 강좌 + 가데이터 "
    + str(40 - original)
    + "개 = 총 40개. 모든 추가 인물은 가상입니다.",
    "begin;",
]
for d in departments:
    sql.append(
        'insert into public.tt_departments(id,"majorName","facultyName","collegeName") values('
        + ",".join(
            [
                str(d["id"]),
                q(d["majorName"]),
                q(d["facultyName"]) if d.get("facultyName") else "null",
                q(d["collegeName"]) if d.get("collegeName") else "null",
            ]
        )
        + ') on conflict(id) do update set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";'
    )
sql.append(
    "select public.tt_save_catalog("
    + q(json.dumps(items, ensure_ascii=False))
    + "::jsonb, false, null);"
)
sql.append("commit;")
(ROOT / "supabase/002_seed.sql").write_text("\n".join(sql))
rows = [HEADERS]
for c in items:
    for s in c["schedules"] if not c["isOnline"] else [{}]:
        rows.append(
            (c["classificationPath"] + [""] * 5)[:5]
            + [
                c["courseCode"],
                c["title"],
                c["sectionNo"],
                c["professorName"],
                c["credit"],
                c["capacity"],
                c["targetGrade"],
                c["departmentId"],
                "온라인" if c["isOnline"] else "오프라인",
                s.get("dayOfWeek", ""),
                s.get("startPeriod", ""),
                s.get("endPeriod", ""),
                s.get("classroom", ""),
                ",".join(map(str, c["excludedDepartmentIds"])),
            ]
        )
Path("/tmp/course_rows.json").write_text(json.dumps(rows, ensure_ascii=False))
print(
    f"원본 {original} + 추가 {40-original} = {len(items)}, 엑셀 데이터 {len(rows)-1}행"
)
