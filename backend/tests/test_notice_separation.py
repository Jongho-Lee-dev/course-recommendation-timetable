from fastapi.testclient import TestClient
from app import main


def test_notice_list_reads_database(monkeypatch):
    rows = [{'id': 1, 'title': 'Notice', 'content': 'Body', 'is_pinned': True}]
    monkeypatch.setattr(main, 'read_catalog_queries', lambda queries: [rows])
    assert TestClient(main.app).get('/api/notices').json() == rows


def test_unimplemented_notice_writes_remain_unavailable():
    client = TestClient(main.app)
    for method, path in [
        ("POST", "/api/admin/notices"),
        ("PUT", "/api/admin/notices/1"),
        ("DELETE", "/api/admin/notices/1"),
    ]:
        assert client.request(method, path).status_code == 404
    assert client.get("/").status_code == 200
