import json
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi.testclient import TestClient
from app import main, chat, recommendations as rec


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv('SESSION_SECRET', 'integration-test-secret-' * 3)
    monkeypatch.setenv('GEMINI_API_KEY', 'fake-test-key')
    rec._requests.clear()
    chat._requests.clear()
    return TestClient(main.app)


def course(course_id, **changes):
    return dict(id=course_id, courseCode=changes.pop('courseCode', f'C{course_id}'),
                title=f'Course {course_id}', category='전공', credit=3,
                schedules=[], **changes)


def headers():
    return {'Authorization': 'Bearer ' + main.token('student', 'test-owner')}


def test_existing_and_ai_routes_coexist():
    paths = {route.path for route in main.app.routes}
    assert {'/api/enrollments', '/api/students', '/api/auth/signup',
            '/api/recommendations', '/api/chat', '/api/admin/courses-import',
            '/api/courses/{course_id}/syllabus'} <= paths


def test_recommendations_filter_duplicate_sections_unknown_ids_and_credit_limit(client, monkeypatch):
    raw = {'recommendations': [{'courseIds': [1, 2, 999, 3, 4], 'reason': '추천'}]}
    response = httpx.Response(200, json={'candidates': [{'content': {
        'parts': [{'text': json.dumps(raw)}]}}]})
    post = AsyncMock(return_value=response)
    monkeypatch.setattr(httpx.AsyncClient, 'post', post)
    result = client.post('/api/recommendations', json={
        'courses': [course(1), course(2, courseCode='C1'), course(3), course(4)],
        'preferences': {'credits': 6},
    })
    assert result.status_code == 200
    assert result.json()['recommendations'][0]['courseIds'] == [1, 3]
    assert post.await_count == 1


def test_recommendations_keep_exclusions_and_time_constraints(client, monkeypatch):
    raw = {'recommendations': [{'courseIds': [1, 2, 3], 'reason': '추천'}]}
    response = httpx.Response(200, json={'candidates': [{'content': {
        'parts': [{'text': json.dumps(raw)}]}}]})
    monkeypatch.setattr(httpx.AsyncClient, 'post', AsyncMock(return_value=response))
    schedule = [{'dayOfWeek': '월', 'startPeriod': 3, 'endPeriod': 4}]
    result = client.post('/api/recommendations', json={
        'courses': [course(1, excludedDepartmentIds=[1]),
                        {**course(2), 'schedules': schedule},
                        {**course(3), 'schedules': schedule}],
        'studentDepartmentId': 1, 'preferences': {'credits': 18},
    })
    assert result.status_code == 200
    assert result.json()['recommendations'][0]['courseIds'] == [2]


def test_recommendations_missing_key_is_clear(client, monkeypatch):
    monkeypatch.delenv('GEMINI_API_KEY')
    result = client.post('/api/recommendations', json={
        'courses': [course(1)], 'preferences': {'credits': 6}})
    assert result.status_code == 503
    assert 'GEMINI_API_KEY' in result.json()['detail']


def test_chat_requires_login(client):
    assert client.post('/api/chat', json={'messages': [
        {'role': 'user', 'text': '안녕하세요'}]}).status_code == 401


def test_chat_uses_liberal_arts_catalog(client, monkeypatch):
    monkeypatch.setattr(main, 'get_courses', lambda: [
        {**course(1), 'majorName': '컴퓨터공학과'},
        {**course(2), 'category': '교양', 'majorName': '다른학과'}])
    ask = AsyncMock(return_value='교양 강좌 안내')
    monkeypatch.setattr(chat, '_ask_gemini', ask)
    result = client.post('/api/chat', headers=headers(), json={
        'messages': [{'role': 'user', 'text': '교양 과목 추천'}],
        'student': {'major': '컴퓨터공학과'}})
    assert result.status_code == 200
    assert result.json()['reply'] == '교양 강좌 안내'
    assert ask.await_args.args[1] == 'available'
    assert [c['courseCode'] for c in ask.await_args.args[2]] == ['C2']


def test_chat_reports_catalog_failure_without_inventing_courses(client, monkeypatch):
    def fail():
        raise RuntimeError('offline')
    monkeypatch.setattr(main, 'get_courses', fail)
    ask = AsyncMock(return_value='현재 강좌 조회가 어렵습니다.')
    monkeypatch.setattr(chat, '_ask_gemini', ask)
    result = client.post('/api/chat', headers=headers(), json={
        'messages': [{'role': 'user', 'text': '교양 과목 추천'}]})
    assert result.status_code == 200
    assert ask.await_args.args[1:] == ('unavailable', [])
