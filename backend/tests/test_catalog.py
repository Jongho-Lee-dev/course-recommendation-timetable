"""DB 연결 없이 API 응답 구성·연결 종료·오류 처리·CORS를 검증합니다."""
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from app import main


class CatalogApiTests(unittest.TestCase):
    def setUp(self):
        main.clear_catalog_cache()
        self.client = TestClient(main.app)

    def connection(self, rows):
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchall.side_effect = rows
        return conn, cursor

    def test_courses_group_children_and_count_seats(self):
        conn, cursor = self.connection([
            [{"id": 1, "remainingSeats": 0, "excludedDepartmentIds": [3]},
             {"id": 2, "remainingSeats": 1, "excludedDepartmentIds": None}],
            [{"id": 10, "openCourseId": 2, "dayOfWeek": "화"}],
        ])
        with patch.object(main, 'get_connection', return_value=conn):
            response = self.client.get('/courses')
        self.assertEqual(response.status_code, 200)
        first, second = response.json()
        self.assertTrue(first['isFull'])
        self.assertEqual(first['schedules'], [])
        self.assertEqual(first['excludedDepartmentIds'], [3])
        self.assertFalse(second['isFull'])
        self.assertEqual(second['schedules'][0]['id'], 10)
        self.assertEqual(second['excludedDepartmentIds'], [])
        self.assertEqual(cursor.execute.call_count, 2)
        conn.close.assert_called_once()

    def test_metadata_and_cors(self):
        for path, rows in [('/departments', [{"id": 1, "majorName": "컴퓨터공학과"}])]:
            with self.subTest(path=path):
                conn, _ = self.connection([rows])
                with patch.object(main, 'get_connection', return_value=conn):
                    response = self.client.get(path, headers={'Origin': 'http://localhost:5173'})
                self.assertEqual(response.json(), rows)
                self.assertEqual(response.headers['access-control-allow-origin'], 'http://localhost:5173')
                conn.close.assert_called_once()

    def test_filters_derive_unique_paths_and_preserve_value_types(self):
        conn, _ = self.connection([[{"classificationPath": ["전공", "전공 필수"]},
                                   {"classificationPath": ["전공", "전공 선택"]},
                                   {"classificationPath": None}]])
        with patch.object(main, 'get_connection', return_value=conn):
            response = self.client.get('/filter-categories')
        self.assertEqual(response.status_code, 200)
        nodes = response.json()
        self.assertEqual(len({n['id'] for n in nodes}), len(nodes))
        roots = [n for n in nodes if n.get('field') == 'category']
        self.assertEqual([n['name'] for n in roots], ['전공'])
        children = [n for n in nodes if n.get('parentId') == roots[0]['id']]
        self.assertEqual(len(children), 2)
        self.assertEqual(children[0]['childFields'], ['collegeName', 'facultyName', 'majorName'])
        self.assertTrue(any(n.get('field') == 'isOnline' and n['value'] is False for n in nodes))
        self.assertTrue(any(n.get('field') == 'targetGrade' and n['value'] == 1 for n in nodes))
        conn.close.assert_called_once()

    def test_failed_connection_returns_503_without_credentials(self):
        with patch.object(main, 'get_connection', side_effect=RuntimeError('password-secret')):
            response = self.client.get('/courses')
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('password-secret', response.text)

    def test_failed_query_still_closes_connection(self):
        conn, cursor = self.connection([])
        cursor.execute.side_effect = RuntimeError('query failed')
        with patch.object(main, 'get_connection', return_value=conn):
            response = self.client.get('/courses')
        self.assertEqual(response.status_code, 503)
        conn.close.assert_called_once()


if __name__ == '__main__':
    unittest.main()
