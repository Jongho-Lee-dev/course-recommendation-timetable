import asyncio
import pytest
from fastapi.testclient import TestClient
from app import main

ROW = {'id': 1, 'capacity': 3, 'active': True, 'classificationPath': ['전공', '전공 필수'],
       'tt_courses': {'courseCode': 'CS', 'credit': 3, 'title': 'test'},
       'tt_departments': {'id': 1, 'majorName': '컴퓨터'}, 'tt_schedules': []}


@pytest.fixture
def fake_db(monkeypatch):
    state = {'loads': 0, 'enrolled': 0}

    async def fake(method, path, body=None, params=None):
        if path == 'rpc/tt_enrollment_snapshot':
            state['loads'] += 1
            await asyncio.sleep(0.01)  # DB가 느린 상황 흉내
            return {'counts': [{'id': 1, 'enrolledCount': state['enrolled']}], 'courseIds': []}
        if path == 'tt_open_courses':
            return [dict(ROW, tt_courses=dict(ROW['tt_courses']))]
        return None

    monkeypatch.setattr(main, 'db', fake)
    return state


def test_repeated_requests_share_one_db_load(fake_db):
    client = TestClient(main.app)
    for _ in range(5):
        assert client.get('/api/courses').status_code == 200
    assert fake_db['loads'] == 1


def test_cache_expires(fake_db, monkeypatch):
    monkeypatch.setattr(main, 'CATALOG_CACHE_SECONDS', 0)
    client = TestClient(main.app)
    client.get('/api/courses'); client.get('/api/courses')
    assert fake_db['loads'] == 2


def test_simultaneous_requests_load_once(fake_db):
    async def many():
        return await asyncio.gather(*[main.courses() for _ in range(50)])
    results = asyncio.run(many())
    assert fake_db['loads'] == 1 and all(r.body == results[0].body for r in results)


def test_cache_off_runs_requests_in_parallel(fake_db, monkeypatch):
    monkeypatch.setattr(main, 'CATALOG_CACHE_SECONDS', 0)
    async def many():
        start = asyncio.get_running_loop().time()
        await asyncio.gather(*[main.courses() for _ in range(10)])
        return asyncio.get_running_loop().time() - start
    elapsed = asyncio.run(many())
    # 각 조회가 0.01초 걸리므로 줄을 서면 0.1초 이상 걸립니다.
    assert fake_db['loads'] == 10 and elapsed < 0.08


def test_admin_change_refreshes_cache(fake_db):
    client = TestClient(main.app)
    assert client.get('/api/courses').json()[0]['enrolledCount'] == 0
    fake_db['enrolled'] = 2
    # 관리자 응답은 캐시를 건너뛰고 최신 값을 돌려주며, 캐시도 새 값으로 바뀝니다.
    assert client.delete('/api/admin/courses/1').json()[0]['enrolledCount'] == 2
    assert client.get('/api/courses').json()[0]['enrolledCount'] == 2


def test_health_does_not_use_db(monkeypatch):
    async def fail(*a, **kw):
        raise AssertionError('health must not call the DB')
    monkeypatch.setattr(main, 'db', fail)
    assert TestClient(main.app).get('/api/health').json() == {'status': 'ok'}
