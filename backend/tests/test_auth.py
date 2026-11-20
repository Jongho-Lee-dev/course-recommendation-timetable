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
        == 422
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


def test_unknown_login_has_cors_and_never_creates_account(setup):
    c, rows = setup
    origin = 'https://course-recommendation-timetable.vercel.app'
    response = c.post('/api/auth/login', json={'studentId': 'unknown', 'password': 'wrong'},
                      headers={'Origin': origin})
    assert response.status_code == 401
    assert response.headers['access-control-allow-origin'] == origin
    assert rows == []


def test_invalid_or_expired_sessions_are_rejected(setup, monkeypatch):
    c, _ = setup
    valid = main.token('student', 'test-owner')
    for value in ['bad-token', valid + 'tampered']:
        assert c.get('/api/students/me', headers={'Authorization': 'Bearer ' + value}).status_code == 401
    from app import session
    now = session.time.time()
    monkeypatch.setattr(session.time, 'time', lambda: now + 30000)
    assert c.get('/api/students/me', headers={'Authorization': 'Bearer ' + valid}).status_code == 401


def test_only_student_id_can_be_changed(setup):
    c, rows = setup
    c.post("/api/auth/signup", json={**PROFILE, "password": "12345678"})
    login = c.post("/api/auth/login", json={"studentId": PROFILE["studentId"], "password": "12345678"}).json()
    headers = {"Authorization": "Bearer " + login["token"]}
    original = rows[0].copy()
    assert c.post("/api/students", json={"studentId": " "}, headers=headers).status_code == 422
    assert c.post("/api/students", json={"studentId": "NEW", "name": "변경"}, headers=headers).status_code == 422
    rows.append({**original, "owner": "another-owner", "studentId": "TAKEN"})
    assert c.post("/api/students", json={"studentId": "TAKEN"}, headers=headers).status_code == 409
    result = c.post("/api/students", json={"studentId": " NEW "}, headers=headers)
    assert result.status_code == 200
    assert result.json()["student"] == {**PROFILE, "studentId": "NEW"}
    assert rows[0] == {**original, "studentId": "NEW"}
    assert c.post("/api/auth/login", json={"studentId": PROFILE["studentId"], "password": "12345678"}).status_code == 401
    assert c.post("/api/auth/login", json={"studentId": "NEW", "password": "12345678"}).status_code == 200


@pytest.mark.parametrize('password', ['short', 'x' * 129])
def test_signup_rejects_invalid_password_without_creating_account(setup, password):
    c, rows = setup
    response = c.post('/api/auth/signup', json={**PROFILE, 'password': password})
    assert response.status_code == 422
    assert rows == []


def test_signup_database_failure_does_not_report_success(setup, monkeypatch):
    from fastapi import HTTPException
    c, rows = setup
    original = main.db

    async def unavailable(method, path, body=None, params=None):
        if method == 'POST' and path == 'tt_students':
            raise HTTPException(503, '학생 정보 DB 연결을 확인하세요.')
        return await original(method, path, body, params)

    monkeypatch.setattr(main, 'db', unavailable)
    response = c.post('/api/auth/signup', json={**PROFILE, 'password': '12345678'})
    assert response.status_code == 503
    assert rows == []
