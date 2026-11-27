"""수강신청 기간. 관리자가 정한 기간에만 수강신청·취소를 허용합니다.

시간은 학생 컴퓨터가 아니라 DB 서버 시간(now())으로 판단합니다.
테이블은 처음 사용할 때 자동으로 만들어집니다.
"""
import logging
from contextlib import closing
from threading import Lock

from fastapi import HTTPException
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, Field, model_validator
from starlette.concurrency import run_in_threadpool

from .database import get_connection

logger = logging.getLogger(__name__)

# 기간은 한 개만 저장합니다(id=1).
TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.registration_period (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    "startsAt" timestamptz NOT NULL,
    "endsAt" timestamptz NOT NULL,
    stopped boolean NOT NULL DEFAULT false,
    "updatedAt" timestamptz NOT NULL DEFAULT now(),
    CHECK ("endsAt" > "startsAt")
);
ALTER TABLE public.registration_period ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON public.registration_period FROM anon, authenticated;
    END IF;
END $$;
"""

# 기간과 DB 서버 시간을 한 번에 읽습니다 (기간이 없으면 startsAt 등이 NULL).
STATE_SQL = """
SELECT (extract(epoch FROM now()) * 1000)::bigint AS now,
       (extract(epoch FROM p."startsAt") * 1000)::bigint AS "startsAt",
       (extract(epoch FROM p."endsAt") * 1000)::bigint AS "endsAt",
       p.stopped
FROM (SELECT 1) AS one
LEFT JOIN public.registration_period AS p ON p.id = 1
"""

_table_ready = False
_table_lock = Lock()


class PeriodInput(BaseModel):
    """시작·종료 시각 (밀리초 단위 Unix 시간). startsAt을 비우면 지금 바로 시작합니다."""
    startsAt: int | None = Field(default=None, ge=0)
    endsAt: int = Field(ge=0)

    @model_validator(mode="after")
    def check(self):
        if self.startsAt is not None and self.endsAt <= self.startsAt:
            raise ValueError("종료 시간은 시작 시간보다 이후여야 합니다.")
        return self


def status_of(period, now):
    if not period:
        return "idle"
    if period["stopped"] or now >= period["endsAt"]:
        return "closed"
    if now < period["startsAt"]:
        return "scheduled"
    return "open"


def _run(statements):
    """순서대로 실행하고 마지막 SELECT 결과를 돌려줍니다. 한 트랜잭션입니다."""
    global _table_ready
    try:
        with closing(get_connection()) as conn:
            with conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    if not _table_ready:
                        with _table_lock:
                            cursor.execute(TABLE_SQL)
                    rows = None
                    for query, values in statements:
                        cursor.execute(query, values)
                        if cursor.description:
                            rows = [dict(row) for row in cursor.fetchall()]
        _table_ready = True
        return rows
    except HTTPException:
        raise
    except Exception as error:
        logger.error("Registration period query failed (%s)", type(error).__name__)
        raise HTTPException(503, "수강신청 기간 DB 조회에 실패했습니다.") from None


def read_state():
    """현재 기간과 DB 서버 시간을 함께 읽습니다."""
    row = _run([(STATE_SQL, None)])[0]
    now = row.pop("now")
    period = row if row["startsAt"] is not None else None
    return period, now


def state_response(period, now):
    return {
        "period": period,
        "status": status_of(period, now),
        "serverTime": now,
    }


def save_period(body: PeriodInput):
    _, now = read_state()
    starts = now if body.startsAt is None else body.startsAt
    if body.endsAt <= starts:
        raise HTTPException(422, "종료 시간은 시작 시간보다 이후여야 합니다.")
    if body.endsAt <= now:
        raise HTTPException(422, "종료 시간은 현재보다 이후여야 합니다.")
    _run([(
        """
        INSERT INTO public.registration_period (id, "startsAt", "endsAt", stopped, "updatedAt")
        VALUES (1, to_timestamp(%s / 1000.0), to_timestamp(%s / 1000.0), false, now())
        ON CONFLICT (id) DO UPDATE SET "startsAt" = excluded."startsAt",
            "endsAt" = excluded."endsAt", stopped = false, "updatedAt" = now()
        """,
        (starts, body.endsAt),
    )])
    return state_response(*read_state())


def stop_period():
    """진행 중이면 지금 종료하고, 아직 시작 전이면 예약을 취소합니다."""
    _run([
        ("""
        UPDATE public.registration_period
        SET stopped = true, "endsAt" = least("endsAt", greatest(now(), "startsAt" + interval '1 millisecond')),
            "updatedAt" = now()
        WHERE id = 1 AND "startsAt" <= now()
        """, None),
        ('DELETE FROM public.registration_period WHERE id = 1 AND "startsAt" > now()', None),
    ])
    return state_response(*read_state())


async def ensure_registration_open():
    """수강신청 API에서 호출합니다. 기간이 아니면 403을 돌려줍니다."""
    period, now = await run_in_threadpool(read_state)
    status = status_of(period, now)
    if status == "open":
        return
    messages = {
        "idle": "수강신청 기간이 아직 정해지지 않았습니다.",
        "scheduled": "아직 수강신청 기간이 아닙니다.",
        "closed": "수강신청 기간이 끝났습니다.",
    }
    raise HTTPException(403, messages[status])


def install_registration_period(app):
    @app.get("/api/registration-period")
    async def get_registration_period():
        return state_response(*await run_in_threadpool(read_state))

    @app.put("/api/admin/registration-period")
    async def put_registration_period(body: PeriodInput):
        return await run_in_threadpool(save_period, body)

    @app.post("/api/admin/registration-period/stop")
    async def stop_registration_period():
        return await run_in_threadpool(stop_period)
