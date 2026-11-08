import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.enrollments import install_enrollments


@pytest.mark.parametrize("action", [None, "add", "cancel", "replace"])
def test_refresh_and_enrollment_changes_keep_current_syllabus(action):
    attachment = {"id": 42, "syllabusPath": "42/file.pdf", "syllabusName": "plan.pdf"}

    async def db(method, path, body=None, params=None):
        if path == "tt_open_courses":
            return [dict(attachment)]
        return {
            "studentId": "test",
            "courses": [{"id": 42, "remainingSeats": 3}],
            "enrolled": [{"id": 42, "remainingSeats": 3}],
        }

    app = FastAPI()
    install_enrollments(
        app, db, lambda: {"role": "student", "sub": "test-owner"}, None
    )
    client = TestClient(app)

    def refresh():
        if action is None:
            return client.get("/api/enrollments")
        return client.post(
            "/api/enrollments", json={"courseIds": [42], "action": action}
        )

    for _ in range(3):
        response = refresh()
        assert response.status_code == 200
        for group in ("courses", "enrolled"):
            course = response.json()[group][0]
            assert course["syllabusPath"] == "42/file.pdf"
            assert course["syllabusName"] == "plan.pdf"
            assert course["remainingSeats"] == 3

    attachment.update(syllabusPath=None, syllabusName=None)
    assert refresh().json()["courses"][0]["syllabusPath"] is None
