import pytest
from fastapi.testclient import TestClient

from app import main


ORIGIN = "https://course-recommendation-timetable-fczu2l407-dustljhs-projects.vercel.app"


def test_courses_cors(monkeypatch):
    async def catalog():
        return []

    monkeypatch.setattr(main, "get_catalog", catalog)
    with TestClient(main.app) as client:
        response = client.get("/api/courses", headers={"Origin": ORIGIN})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ORIGIN
    assert "Origin" in response.headers["vary"]


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
