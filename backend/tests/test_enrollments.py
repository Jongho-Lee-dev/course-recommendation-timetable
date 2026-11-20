import uuid
import pytest
from fastapi.testclient import TestClient
from app import main

OWNER = "00000000-0000-4000-8000-000000000001"


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("SESSION_SECRET", "test-secret-" * 4)
    return TestClient(main.app)


def headers():
    return {"Authorization": f'Bearer {main.token("student",OWNER)}'}


def test_requires_student_session(client):
    assert client.post("/api/enrollments", json={"courseIds": [1]}).status_code == 401
    assert client.get("/api/enrollments").status_code == 401
    h = {"Authorization": f'Bearer {main.token("admin","admin")}'}
    assert (
        client.post("/api/enrollments", json={"courseIds": [1]}, headers=h).status_code
        == 403
    )


@pytest.mark.parametrize("action", ["add", "cancel", "replace"])
def test_owner_from_token_and_atomic_rpc(client, monkeypatch, action):
    calls = []

    async def fake(method, path, body=None, params=None):
        calls.append((method, path, body, params))
        if path == "tt_students":
            return [{"studentId": "20260001"}]
        if path == "rpc/tt_enrollment_snapshot":
            return {"counts": [], "courseIds": []}
        if path == "tt_open_courses":
            return []
        if path in ["rpc/tt_apply_enrollments", "rpc/tt_enrollment_state"]:
            return {"studentId": "20260001", "courses": [], "enrolled": []}

    monkeypatch.setattr(main, "db", fake)
    r = client.post(
        "/api/enrollments",
        headers=headers(),
        json={"courseIds": [1, 2], "action": action, "studentOwner": str(uuid.uuid4())},
    )
    assert r.status_code == 200
    change = [c for c in calls if c[1] == "rpc/tt_apply_enrollments"]
    assert len(change) == 1
    assert len(calls) == 1  # 저장 후 재조회 없이 DB 왕복 1회
    assert change[0][2] == {
        "p_owner": OWNER,
        "p_course_ids": [1, 2],
        "p_action": action,
    }
    assert r.json()["studentId"] == "20260001"


@pytest.mark.parametrize(
    "payload",
    [
        {"courseIds": [0]},
        {"courseIds": [-1]},
        {"courseIds": [1], "action": "delete"},
        {"courseIds": list(range(1, 102))},
    ],
)
def test_invalid_requests(client, payload):
    assert (
        client.post("/api/enrollments", headers=headers(), json=payload).status_code
        == 422
    )


def test_catalog_shows_real_counts(client, monkeypatch):
    monkeypatch.setattr(main, "read_catalog_queries", lambda queries: [
        [{"id": 1, "capacity": 3, "enrolledCount": 2, "remainingSeats": 1}], []
    ])
    course = client.get("/api/courses").json()[0]
    assert (
        course["enrolledCount"] == 2
        and course["remainingSeats"] == 1
        and course["capacity"] == 3
    )


def test_student_cannot_change_other_profile_fields(client, monkeypatch):
    writes = []

    async def fake(method, path, body=None, params=None):
        if path == "tt_departments":
            return [{"id": 1}]
        if path == "tt_students" and method == "GET":
            return [{"studentId": "OLD"}]
        if path == "tt_students":
            writes.append((method, body))

    monkeypatch.setattr(main, "db", fake)
    body = {
        "studentId": "NEW",
        "name": "새학생",
        "grade": 2,
        "departmentId": 1,
        "completedCredits": 0,
        "graduationCredits": 130,
        "maxCredits": 18,
    }
    r = client.post("/api/students", headers=headers(), json=body)
    assert r.status_code == 422
    assert writes == []


def test_my_enrollments_one_db_request(client, monkeypatch):
    calls = []

    async def fake(method, path, body=None, params=None):
        calls.append(path)
        return {"studentId": "TEST", "courses": [], "enrolled": []}

    monkeypatch.setattr(main, "db", fake)
    assert client.get("/api/enrollments", headers=headers()).status_code == 200
    assert calls == ["rpc/tt_enrollment_state"]


def test_enrollment_write_invalidates_catalog(client, monkeypatch):
    calls = []

    def query(method, path, body=None, params=None):
        calls.append((path, body))
        return {"studentId": "TEST", "courses": [], "enrolled": []}

    monkeypatch.setattr(main, "enrollment_query", query)
    main._catalog_cache.update(body=b"stale")
    response = client.post("/api/enrollments", headers=headers(),
                           json={"courseIds": [1], "action": "cancel"})
    assert response.status_code == 200
    assert calls[0][0] == "rpc/tt_apply_enrollments"
    assert main._catalog_cache["body"] is None
