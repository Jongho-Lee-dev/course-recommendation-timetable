import pytest
from fastapi.testclient import TestClient

from app import main


ORIGIN = "https://course-recommendation-timetable.vercel.app"


def test_courses_cors(monkeypatch):
    def catalog():
        return []

    monkeypatch.setattr(main, "get_courses", catalog)
    with TestClient(main.app) as client:
        response = client.get("/api/courses", headers={"Origin": ORIGIN})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ORIGIN
    assert "Origin" in response.headers["vary"]


def test_filter_categories_cors(monkeypatch):
    monkeypatch.setattr(main, "read_catalog_queries", lambda queries: [[]])
    response = TestClient(main.app).get('/filter-categories', headers={'Origin': ORIGIN})
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == ORIGIN


def test_cors_environment_additions_are_normalized(monkeypatch):
    monkeypatch.setenv('CORS_ORIGINS', ' https://custom.example/ , ,*')
    origins = main.cors_origins()
    assert ORIGIN in origins
    assert 'https://custom.example' in origins
    assert '*' not in origins


def test_db_error_still_has_cors_headers(monkeypatch):
    def fail():
        raise RuntimeError('DB unavailable')
    monkeypatch.setattr(main, 'get_connection', fail)
    response = TestClient(main.app).get('/filter-categories', headers={'Origin': ORIGIN})
    assert response.status_code == 503
    assert response.headers['access-control-allow-origin'] == ORIGIN


@pytest.mark.parametrize("origin,allowed", [
    (ORIGIN, True),
    ("https://unrelated-project.vercel.app", False),
    (ORIGIN + ".example.com", False),
])
def test_cors_preflight(origin, allowed):
    with TestClient(main.app) as client:
        response = client.options("/api/courses", headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        })
    assert response.status_code == (200 if allowed else 400)
    assert response.headers.get("access-control-allow-origin") == (
        origin if allowed else None
    )
