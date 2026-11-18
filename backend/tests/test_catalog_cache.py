"""PR #8 cache behavior adapted to the synchronous PostgreSQL catalog."""
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier
from unittest import TestCase
from unittest.mock import patch

from fastapi.testclient import TestClient
from app import main


class CatalogCacheTests(TestCase):
    def setUp(self):
        main.clear_catalog_cache()
        self.client = TestClient(main.app)
        self.loader = patch.object(main, "get_courses", return_value=[{"id": 1, "credit": Decimal("3")}])
        self.load = self.loader.start()
        self.addCleanup(self.loader.stop)
        self.addCleanup(main.clear_catalog_cache)

    def test_requests_share_serialized_response_across_routes(self):
        for path in ["/courses", "/api/courses"] * 3:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json(), [{"id": 1, "credit": 3}])
        self.assertEqual(self.load.call_count, 1)

    def test_cache_expires(self):
        with patch.object(main.time, "monotonic", return_value=10):
            main.courses()
        with patch.object(main.time, "monotonic", return_value=13):
            main.courses()
        self.assertEqual(self.load.call_count, 2)

    def test_simultaneous_requests_load_once(self):
        with ThreadPoolExecutor(max_workers=20) as pool:
            results = list(pool.map(lambda _: main.courses().body, range(50)))
        self.assertEqual(self.load.call_count, 1)
        self.assertTrue(all(body == results[0] for body in results))

    def test_disabled_cache_does_not_serialize_db_calls(self):
        barrier = Barrier(5)
        self.load.side_effect = lambda: barrier.wait(timeout=5)
        with patch.object(main, "CATALOG_CACHE_SECONDS", 0):
            with ThreadPoolExecutor(max_workers=5) as pool:
                list(pool.map(lambda _: main.courses(), range(5)))
        self.assertEqual(self.load.call_count, 5)

    def test_explicit_refresh_updates_cache(self):
        main.courses()
        self.load.return_value = [{"id": 2}]
        self.assertEqual(main.fresh_courses(), [{"id": 2}])
        self.assertEqual(self.client.get('/courses').json(), [{"id": 2}])
        self.assertEqual(self.load.call_count, 2)

    def test_health_does_not_query_db(self):
        with patch.object(main, 'get_connection', side_effect=AssertionError('DB called')):
            self.assertEqual(self.client.get('/api/health').json(), {'status': 'ok'})
        self.load.assert_not_called()

    def test_failed_load_is_not_cached(self):
        self.load.side_effect = [RuntimeError('DB unavailable'), []]
        with self.assertRaises(RuntimeError):
            main.courses()
        self.assertEqual(self.client.get('/courses').json(), [])
        self.assertEqual(self.load.call_count, 2)
