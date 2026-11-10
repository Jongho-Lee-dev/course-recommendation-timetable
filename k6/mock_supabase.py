"""부하 테스트용 가짜 Supabase. 실제 DB 없이 백엔드 캐시 효과를 확인합니다.

배포 서버에서 잰 속도에 맞췄습니다: 쿼리 1개 약 0.6초, 동시에 10개까지만 처리
(→ 과목 목록 요청을 초당 약 8~10개만 처리하던 배포 서버와 비슷합니다).

실행 (backend 폴더에서):
  venv\\Scripts\\python -m uvicorn --app-dir ../k6 mock_supabase:app --port 54321
  SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=fake python -m uvicorn app.main:app

GET /stats 로 백엔드가 DB에 보낸 쿼리 수를 확인할 수 있습니다.
"""
import asyncio
import json
import os
from pathlib import Path
from fastapi import FastAPI

DELAY = float(os.getenv('MOCK_DB_DELAY', '0.6'))
CONCURRENCY = int(os.getenv('MOCK_DB_CONCURRENCY', '10'))
SEED = json.loads((Path(__file__).resolve().parents[1] / 'backend/seed_courses.json').read_text(encoding='utf-8'))

app = FastAPI()
stats = {'queries': 0, 'max_waiting': 0}
waiting = 0
slots = None


def build_rows():
    rows, schedule_id = [], 0
    for i, c in enumerate(SEED, start=1):
        schedules = []
        for s in c['schedules']:
            schedule_id += 1
            schedules.append({'id': schedule_id, 'openCourseId': i, **s})
        rows.append({
            'id': i, 'courseCode': c['courseCode'], 'sectionNo': c['sectionNo'], 'professorName': c['professorName'],
            'capacity': c['capacity'], 'targetGrade': c['targetGrade'], 'departmentId': c['departmentId'],
            'isOnline': c['isOnline'], 'classificationPath': c['classificationPath'],
            'excludedDepartmentIds': c['excludedDepartmentIds'], 'active': True,
            'tt_courses': {'courseCode': c['courseCode'], 'title': c['title'], 'credit': c['credit']},
            'tt_departments': {'id': c['departmentId'], 'majorName': f"학과{c['departmentId']}", 'facultyName': '학부', 'collegeName': '대학'},
            'tt_schedules': schedules,
        })
    return rows


ROWS = build_rows()


async def query():
    """DB 한 번 조회: 빈 자리가 날 때까지 기다린 뒤 DELAY초 걸립니다."""
    global waiting, slots
    if slots is None: slots = asyncio.Semaphore(CONCURRENCY)
    stats['queries'] += 1
    waiting += 1
    stats['max_waiting'] = max(stats['max_waiting'], waiting)
    async with slots:
        waiting -= 1
        await asyncio.sleep(DELAY)


@app.post('/rest/v1/rpc/tt_enrollment_snapshot')
async def snapshot():
    await query()
    return {'counts': [{'id': r['id'], 'enrolledCount': r['id'] % 7} for r in ROWS], 'courseIds': []}


@app.get('/rest/v1/tt_open_courses')
async def open_courses():
    await query()
    return ROWS


@app.get('/rest/v1/tt_departments')
async def departments():
    await query()
    return [{'id': d} for d in sorted({r['departmentId'] for r in ROWS})]


@app.get('/stats')
async def get_stats():
    return stats


@app.post('/stats/reset')
async def reset_stats():
    stats.update(queries=0, max_waiting=0)
    return stats
