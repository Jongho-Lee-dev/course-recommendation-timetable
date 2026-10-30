import pytest
from fastapi.testclient import TestClient
from app import main
from app.auth import password_hash, password_matches

PROFILE = dict(
    studentId="20260001",
    name="학생",
    grade=1,
    departmentId=1,
    completedCredits=0,
    graduationCredits=130,
    maxCredits=18,
)


@pytest.fixture
def setup(monkeypatch):
    monkeypatch.setenv("SESSION_SECRET", "secret-for-testing-" * 3)
    rows = []

    async def fake(method, path, body=None, params=None):
        if path == "tt_departments":
            return [{"id": 1}]
        if method == "GET":
            return [
                r
                for r in rows
                if all(
                    str(r.get(k)) == v[3:]
                    for k, v in (params or {}).items()
                    if k not in ("select", "limit")
                )
            ]
        if method == "POST":
            rows.append(body.copy())
            return [body]
        if method == "PATCH":
            rows[0].update(body)
            return rows

    monkeypatch.setattr(main, "db", fake)
    return TestClient(main.app), rows


def test_hash():
    a = password_hash(" password ")
    assert a != password_hash(" password ")
    assert password_matches(" password ", a)
    assert not password_matches("password", a)


def test_signup_login_and_profile(setup):
    c, rows = setup
    assert (
        c.post(
            "/api/auth/signup", json={**PROFILE, "password": " password "}
        ).status_code
        == 201
    )
    assert "password" not in rows[0]
    r = c.post(
        "/api/auth/login",
        json={"studentId": PROFILE["studentId"], "password": " password "},
    )
    assert r.status_code == 200
    assert "passwordHash" not in r.text and "owner" not in r.json()["student"]
    h = {"Authorization": "Bearer " + r.json()["token"]}
    assert c.get("/api/students/me", headers=h).json() == PROFILE
    assert c.post("/api/students", json=PROFILE).status_code == 401
    assert (
        c.post(
            "/api/students", json={**PROFILE, "studentId": "other"}, headers=h
        ).status_code
        == 403
    )
    assert (
        c.post("/api/auth/signup", json={**PROFILE, "password": "12345678"}).status_code
        == 409
    )
    assert (
        c.post(
            "/api/auth/login",
            json={"studentId": PROFILE["studentId"], "password": "wrong"},
        ).status_code
        == 401
    )


def test_legacy_student_cannot_be_claimed(setup):
    c, rows = setup
    rows.append(dict(PROFILE, owner="legacy"))
    assert (
        c.post("/api/auth/signup", json={**PROFILE, "password": "12345678"}).status_code
        == 409
    )
    assert (
        c.post(
            "/api/auth/login",
            json={"studentId": PROFILE["studentId"], "password": "12345678"},
        ).status_code
        == 401
    )
    assert len(rows) == 1
