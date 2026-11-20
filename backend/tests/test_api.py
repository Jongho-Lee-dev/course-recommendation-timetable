import copy, os
from pathlib import Path
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app import main
from app.excel import parse_excel, export_excel

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("SESSION_SECRET", "test-secret-" * 4)
    return TestClient(main.app)

def test_cors_allows_deployed_frontend(client):
    origin='https://course-recommendation-timetable.vercel.app'
    r=client.options('/api/courses',headers={'Origin':origin,'Access-Control-Request-Method':'GET'})
    assert r.status_code==200
    assert r.headers['access-control-allow-origin']==origin

def test_excel_roundtrips_current_workbook_and_seed():
    old = parse_excel((ROOT / "과목 데이터.xlsx").read_bytes())
    import json

    new = json.loads((ROOT / "backend/seed_courses.json").read_text(encoding="utf-8"))
    # The administrator workbook is editable and is not the frozen seed fixture.
    assert old and len(new) == 40
    assert parse_excel(export_excel(old)) == old
    assert parse_excel(export_excel(new)) == new
    assert len(old[0]["schedules"]) == 2
    assert old[0]["sectionNo"] == "01"


def test_reject_invalid_excel_before_db(client, monkeypatch):
    async def fail(*a, **kw):
        raise AssertionError("DB must not be called")

    monkeypatch.setattr(main, "db", fail)
    r = client.post("/api/admin/courses-import", files={"file": ("bad.xlsx", b"bad")})
    assert r.status_code == 422


def test_admin_no_auth_student_still_protected(client, monkeypatch):
    conn = MagicMock()
    cursor = conn.cursor.return_value.__enter__.return_value
    monkeypatch.setattr(main, "get_connection", lambda: conn)
    monkeypatch.setattr(main, "fresh_courses", lambda: [])
    assert client.delete("/api/admin/courses/1").status_code == 200
    cursor.execute.assert_called_once_with('SELECT public.tt_delete_course(%s)', (1,))
    assert conn.__exit__.call_args.args == (None, None, None)
    assert client.get("/api/students/me").status_code == 401
    assert (
        client.get(
            "/api/students/me", headers={"Authorization": "Bearer invalid"}
        ).status_code
        == 401
    )
    assert (
        client.post("/api/admin/login", json={"password": "anything"}).status_code
        == 404
    )


def test_import_uses_one_transaction(client, monkeypatch):
    conn = MagicMock()
    cursor = conn.cursor.return_value.__enter__.return_value
    cursor.fetchall.return_value = [(x,) for x in [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15]]
    monkeypatch.setattr(main, "get_connection", lambda: conn)
    r = client.post(
        "/api/admin/courses-import",
        files={"file": ("data.xlsx", (ROOT / "과목 데이터.xlsx").read_bytes())},
    )
    assert r.status_code == 200
    writes = [c.args for c in cursor.execute.call_args_list if "tt_save_catalog" in c.args[0]]
    assert len(writes) == 1
    expected = parse_excel((ROOT / "과목 데이터.xlsx").read_bytes())
    assert writes[0][1][0].adapted == expected and writes[0][1][1] is True
    assert r.json() == {"savedCount": len(expected)}
    assert conn.__enter__.call_count == 1
    assert conn.__exit__.call_args.args == (None, None, None)


def test_student_validation(client):
    r = client.post(
        "/api/auth/signup",
        json={
            "password": "12345678",
            "studentId": "123",
            "name": "학생",
            "grade": 2,
            "departmentId": 1,
            "completedCredits": 200,
            "graduationCredits": 130,
            "maxCredits": 18,
        },
    )
    assert r.status_code == 422


def test_course_rejects_duplicate_schedules():
    from app.models import Course

    original = parse_excel((ROOT / "과목 데이터.xlsx").read_bytes())[0]
    original["schedules"].append(copy.deepcopy(original["schedules"][0]))
    with pytest.raises(ValueError):
        Course.model_validate(original)


def test_delivered_workbook_roundtrips_current_edits():
    courses = parse_excel((ROOT / "과목_가데이터_40개.xlsx").read_bytes())
    assert courses
    assert parse_excel(export_excel(courses)) == courses
    keys = [(course["courseCode"], course["sectionNo"]) for course in courses]
    assert len(keys) == len(set(keys))
