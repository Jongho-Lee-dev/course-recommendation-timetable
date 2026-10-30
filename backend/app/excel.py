from io import BytesIO
from zipfile import ZipFile, BadZipFile
import openpyxl
from .models import Course

HEADERS = [
    "구분",
    "이수 구분",
    "영역",
    "하위 영역 1",
    "하위 영역 2",
    "학수번호",
    "과목명",
    "분반",
    "담당교수",
    "학점",
    "정원",
    "대상학년",
    "학과코드",
    "온라인/오프라인",
    "요일",
    "시작교시",
    "종료교시",
    "강의실",
    "제외 학과코드",
]


def parse_excel(data: bytes) -> list[dict]:
    try:
        with ZipFile(BytesIO(data)) as archive:
            if sum(x.file_size for x in archive.infolist()) > 30 * 1024 * 1024:
                raise ValueError("압축 해제 크기는 30MB 이하여야 합니다.")
        book = openpyxl.load_workbook(BytesIO(data), read_only=True, data_only=True)
    except (BadZipFile, KeyError) as e:
        raise ValueError("올바른 xlsx 파일이 아닙니다.") from e
    try:
        rows = iter(book.active.values)
        if list(next(rows, ())) != HEADERS:
            raise ValueError("A~S열 헤더와 순서가 양식과 다릅니다.")
        grouped = {}
        for number, row in enumerate(rows, 2):
            if number > 10001:
                raise ValueError("최대 10000행까지 업로드할 수 있습니다.")
            if not any(v is not None and str(v).strip() for v in row):
                continue
            get = lambda i: str(
                row[i] if i < len(row) and row[i] is not None else ""
            ).strip()
            try:
                if get(13) not in ["온라인", "오프라인"]:
                    raise ValueError("수업형태 오류")
                path = [get(i) for i in range(5)]
                if any(path[i] and not path[i - 1] for i in range(1, 5)):
                    raise ValueError("분류 중간에 빈칸이 있습니다.")
                online = get(13) == "온라인"
                if online and any(get(i) for i in range(14, 18)):
                    raise ValueError("온라인 시간은 비워주세요.")
                basic = dict(
                    courseCode=get(5),
                    sectionNo=get(7),
                    title=get(6),
                    professorName=get(8),
                    credit=float(get(9)),
                    capacity=int(get(10)),
                    targetGrade=int(get(11)),
                    departmentId=int(get(12)),
                    isOnline=online,
                    classificationPath=[x for x in path if x],
                    excludedDepartmentIds=sorted(
                        set(int(x.strip()) for x in get(18).split(",") if x.strip())
                    ),
                )
                key = (get(5), get(7))
                if (
                    key in grouped
                    and {k: v for k, v in grouped[key].items() if k != "schedules"}
                    != basic
                ):
                    raise ValueError("같은 학수번호·분반의 기본정보가 다릅니다.")
                entry = grouped.setdefault(key, {**basic, "schedules": []})
                if not online:
                    entry["schedules"].append(
                        dict(
                            dayOfWeek=get(14),
                            startPeriod=int(get(15)),
                            endPeriod=int(get(16)),
                            classroom=get(17),
                        )
                    )
            except (ValueError, TypeError) as e:
                raise ValueError(f"{number}행: {e}") from e
        if not grouped:
            raise ValueError("등록할 과목이 없습니다.")
        return [Course.model_validate(c).model_dump() for c in grouped.values()]
    finally:
        book.close()


def export_excel(courses: list[dict]) -> bytes:
    book = openpyxl.Workbook()
    sheet = book.active
    sheet.title = "과목 목록"
    sheet.append(HEADERS)
    for c in courses:
        path = (c["classificationPath"] + [""] * 5)[:5]
        for s in (c["schedules"] if not c["isOnline"] else [{}]):
            sheet.append(
                path
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
    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = sheet.dimensions
    out = BytesIO()
    book.save(out)
    return out.getvalue()
