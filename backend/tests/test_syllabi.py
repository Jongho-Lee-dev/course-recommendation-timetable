import copy

import httpx
import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app import syllabi


@pytest.fixture
def setup(monkeypatch):
    row = {"id": 42, "syllabusPath": None, "syllabusName": None}
    objects = {}
    state = {"fail_patch": False}

    async def db(method, table, body=None, params=None):
        if params["id"] != "eq.42":
            return []
        if method == "GET":
            return [copy.deepcopy(row)]
        if state["fail_patch"]:
            raise HTTPException(502, "DB unavailable")
        row.update(body)
        return [copy.deepcopy(row)]

    async def storage(method, path, **kwargs):
        if method == "POST":
            objects[path.removeprefix(f"object/{syllabi.BUCKET}/")] = kwargs["content"]
            return httpx.Response(200, json={})
        if method == "DELETE":
            for key in kwargs["json"]["prefixes"]:
                objects.pop(key, None)
            return httpx.Response(200, json=[])
        key = path.removeprefix(f"object/authenticated/{syllabi.BUCKET}/")
        return httpx.Response(200, content=objects[key])

    monkeypatch.setattr(syllabi, "storage_request", storage)
    app = FastAPI()
    syllabi.install_syllabi(app, db)
    return TestClient(app), row, objects, state, app


def upload(client, name="강의계획.pdf", content=b"%PDF-1.7\nexample"):
    return client.put(
        "/api/admin/courses/42/syllabus",
        files={"file": (name, content, "application/pdf")},
    )


def test_persistent_upload_student_read_replace_and_delete(setup):
    client, row, objects, _, app = setup
    response = upload(client)
    assert response.status_code == 200
    first = row["syllabusPath"]
    assert first.startswith("42/")
    assert row["syllabusName"] == "강의계획.pdf"
    student = TestClient(app)
    response = student.get("/api/courses/42/syllabus")
    assert response.status_code == 200
    assert response.content == objects[first]
    assert response.headers["content-type"] == "application/pdf"
    assert "inline" in response.headers["content-disposition"]
    assert upload(client, "replacement.pdf").status_code == 200
    assert first not in objects
    assert len(objects) == 1
    assert client.delete("/api/admin/courses/42/syllabus").status_code == 200
    assert not objects
    assert student.get("/api/courses/42/syllabus").status_code == 404


@pytest.mark.parametrize("name,content", [("x.txt", b"%PDF-1.7"), ("x.pdf", b"not pdf")])
def test_invalid_files_rejected(setup, name, content):
    client, _, objects, _, _ = setup
    assert upload(client, name, content).status_code == 422
    assert not objects


def test_size_limit_and_missing_course(setup, monkeypatch):
    client, _, objects, _, _ = setup
    monkeypatch.setattr(syllabi, "MAX_BYTES", 8)
    assert upload(client).status_code == 413
    assert client.put(
        "/api/admin/courses/999/syllabus", files={"file": ("x.pdf", b"%PDF-")}
    ).status_code == 404
    assert not objects


def test_db_failure_keeps_previous_pdf_and_cleans_new_object(setup):
    client, row, objects, state, _ = setup
    assert upload(client).status_code == 200
    first = row["syllabusPath"]
    state["fail_patch"] = True
    assert upload(client, "replacement.pdf").status_code == 502
    assert row["syllabusPath"] == first
    assert list(objects) == [first]
