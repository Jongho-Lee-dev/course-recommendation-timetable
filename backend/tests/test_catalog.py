"""DB 연결 없이 API 응답 구성·연결 종료·오류 처리·CORS를 검증합니다."""
import unittest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from app import main


class CatalogApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)

    def connection(self, rows):
        conn = MagicMock()
        cursor = conn.cursor.return_value.__enter__.return_value
        cursor.fetchall.side_effect = rows
        return conn, cursor

    def test_courses_group_children_and_count_seats(self):
        conn, cursor = self.connection([
            [{"id": 1, "remainingSeats": 0}, {"id": 2, "remainingSeats": 1}],
            [{"id": 10, "openCourseId": 2, "dayOfWeek": "화"}],
            [{"openCourseId": 1, "departmentId": 3}],
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
        self.assertEqual(cursor.execute.call_count, 3)
        conn.close.assert_called_once()

    def test_metadata_and_cors(self):
        for path, rows in [('/departments', [{"id": 1, "majorName": "컴퓨터공학과"}]),
                           ('/filter-categories', [{"id": 1, "name": "전공", "parentId": None}])]:
            with self.subTest(path=path):
                conn, _ = self.connection([rows])
                with patch.object(main, 'get_connection', return_value=conn):
                    response = self.client.get(path, headers={'Origin': 'http://localhost:5173'})
                self.assertEqual(response.json(), rows)
                self.assertEqual(response.headers['access-control-allow-origin'], 'http://localhost:5173')
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
