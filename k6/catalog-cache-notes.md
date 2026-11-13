# PR #8 integration

The current backend uses synchronous psycopg2 queries against `public.tt_*`.
PR #8's two-second catalog cache is adapted with a threading lock and a cached
JSON response, including Decimal serialization. Both `/courses` and
`/api/courses` share the cache. `CATALOG_CACHE_SECONDS=0` disables caching without
serializing database requests. `/api/health` does not query the database.

`fresh_courses()` refreshes the cache explicitly. Current course write endpoints
are not implemented; any future write endpoint must refresh or invalidate the
cache after a successful write. PR #8's changes to the legacy async HTTP client
test and admin write handlers do not apply to this backend.

`students_2000.js` is imported from PR #8. It models polling every five seconds;
this is a synthetic scenario, not the current frontend's polling behavior.
The 2,000-user scenario has not been run against the shared database.

`mock_supabase.py` is preserved from the PR for the legacy Supabase REST backend.
It cannot replace PostgreSQL for the current psycopg2 backend. The cache tests
use an isolated mock loader instead and require no external database.

Run the focused checks from `backend`:

```powershell
.\venv\Scripts\python.exe -m pytest tests/test_catalog.py tests/test_catalog_cache.py tests/test_notice_separation.py -q
```
