from fastapi.testclient import TestClient
from app import main


def test_notice_routes_are_left_to_notice_branch(monkeypatch):
    async def unexpected(*args, **kwargs):
        raise AssertionError("분리한 공지 API는 DB를 호출하면 안 됩니다.")

    monkeypatch.setattr(main, "db", unexpected)
    client = TestClient(main.app)
    for method, path in [
        ("GET", "/api/notices"),
        ("POST", "/api/admin/notices"),
        ("PUT", "/api/admin/notices/1"),
        ("DELETE", "/api/admin/notices/1"),
    ]:
        assert client.request(method, path).status_code == 404
    assert client.get("/").status_code == 200
