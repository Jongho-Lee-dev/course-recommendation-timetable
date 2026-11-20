"""Run the existing enrollment functions through the PostgreSQL connection."""
import logging
from contextlib import closing

from fastapi import HTTPException
from psycopg2.errors import RaiseException

from .database import get_connection


def enrollment_query(method, table, body=None, params=None):
    if method != "POST" or table not in {
        "rpc/tt_enrollment_state", "rpc/tt_apply_enrollments"
    }:
        raise ValueError("Unsupported enrollment operation")
    try:
        with closing(get_connection()) as conn:
            with conn:
                with conn.cursor() as cursor:
                    if table == "rpc/tt_apply_enrollments":
                        cursor.execute(
                            "SELECT public.tt_apply_enrollments(%s::uuid, %s::bigint[], %s)",
                            (body["p_owner"], body["p_course_ids"], body["p_action"]),
                        )
                    else:
                        cursor.execute("SELECT public.tt_enrollment_state(%s::uuid)",
                                       (body["p_owner"],))
                    result = cursor.fetchone()[0]
                    # Include attachments before committing so a failed read rolls back writes.
                    cursor.execute('SELECT id, "syllabusPath", "syllabusName" FROM public.tt_open_courses')
                    attachments = {row[0]: row[1:] for row in cursor.fetchall()}
                    for item in [*result.get("courses", []), *result.get("enrolled", [])]:
                        item["syllabusPath"], item["syllabusName"] = attachments.get(item["id"], (None, None))
                    return result
    except RaiseException as error:
        raise HTTPException(409, error.diag.message_primary) from None
    except Exception as error:
        logging.getLogger(__name__).error("Enrollment query failed (%s)", type(error).__name__)
        raise HTTPException(503, "수강신청 DB 연결 및 003·004 SQL 적용 여부를 확인하세요.") from None
