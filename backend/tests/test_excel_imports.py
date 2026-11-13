from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException

from app import main
from app.excel import export_excel


COURSE = {
    'courseCode': 'TEST', 'sectionNo': '01', 'title': '테스트',
    'professorName': '교수', 'credit': 3, 'capacity': 20, 'targetGrade': 1,
    'departmentId': 1, 'isOnline': True,
    'classificationPath': ['전공', '전공 선택'],
    'excludedDepartmentIds': [], 'schedules': [],
}
client = TestClient(main.app)


def connection():
    conn = MagicMock()
    cursor = conn.cursor.return_value.__enter__.return_value
    return conn, cursor


def test_course_sheet_is_parsed_and_saved_atomically():
    conn, cursor = connection()
    cursor.fetchall.return_value = [(1,)]
    with patch.object(main, 'get_connection', return_value=conn):
        response = client.post('/api/admin/courses-import', files={
            'file': ('courses.xlsx', export_excel([COURSE]),
                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        })
    assert response.status_code == 200
    assert response.json() == {'savedCount': 1}
    sql, params = cursor.execute.call_args.args
    assert 'tt_save_catalog' in sql
    assert params[0].adapted == [COURSE]
    assert params[1:] == (True, None)
    assert conn.__exit__.call_args.args == (None, None, None)
    conn.close.assert_called_once()


@pytest.mark.parametrize('payload', [b'not an Excel file', b''])
def test_invalid_file_does_not_write(payload):
    with patch.object(main, 'save_import') as save:
        response = client.post('/api/admin/courses-import', files={'file': ('x.xlsx', payload)})
    assert response.status_code == 422
    save.assert_not_called()


def test_unknown_department_rolls_back_before_catalog_write():
    conn, cursor = connection()
    cursor.fetchall.return_value = [(2,)]
    with patch.object(main, 'get_connection', return_value=conn):
        with pytest.raises(HTTPException) as error:
            main.save_import([COURSE])
    assert error.value.status_code == 422
    assert cursor.execute.call_count == 1
    assert conn.__exit__.call_args.args[0] is HTTPException
    conn.close.assert_called_once()


def test_department_import_upserts_without_deleting_existing_departments():
    conn, cursor = connection()
    with patch.object(main, 'get_connection', return_value=conn):
        response = client.post('/api/admin/departments-import', json={
            'items': [{'id': 1, 'majorName': ' 컴퓨터학과 ', 'collegeName': '공과대학'}],
        })
    assert response.status_code == 200
    sql, rows = cursor.executemany.call_args.args
    assert 'ON CONFLICT' in sql and 'DELETE' not in sql
    assert rows == [(1, '공과대학', None, '컴퓨터학과')]
    assert conn.__exit__.call_args.args == (None, None, None)
    conn.close.assert_called_once()


@pytest.mark.parametrize('items', [[], [{'id': 1, 'majorName': ' '}],
    [{'id': 1, 'majorName': 'A'}, {'id': 1, 'majorName': 'B'}]])
def test_invalid_departments_never_reach_db(items):
    with patch.object(main, 'get_connection') as connect:
        assert client.post('/api/admin/departments-import', json={'items': items}).status_code == 422
    connect.assert_not_called()


def test_save_failure_rolls_back_and_preserves_cache():
    conn, cursor = connection()
    cursor.executemany.side_effect = RuntimeError('private DB password')
    main._catalog_cache.update(data=[], body=b'[]', at=1)
    with patch.object(main, 'get_connection', return_value=conn):
        response = client.post('/api/admin/departments-import', json={
            'items': [{'id': 1, 'majorName': 'A'}],
        })
    assert response.status_code == 503
    assert 'private DB password' not in response.text
    assert conn.__exit__.call_args.args[0] is RuntimeError
    assert main._catalog_cache['body'] == b'[]'


def test_import_preflight_allows_post():
    response = client.options('/api/admin/courses-import', headers={
        'Origin': 'http://127.0.0.1:5173',
        'Access-Control-Request-Method': 'POST',
    })
    assert response.status_code == 200
