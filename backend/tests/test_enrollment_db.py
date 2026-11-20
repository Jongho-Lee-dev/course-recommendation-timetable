from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from app import enrollment_db


@pytest.mark.parametrize("action", [None, "add", "cancel"])
def test_enrollment_query_parameters_and_transaction(monkeypatch, action):
    conn = MagicMock()
    cursor = conn.cursor.return_value.__enter__.return_value
    cursor.fetchone.return_value = ({"studentId": "TEST", "courses": [{"id": 1}], "enrolled": [{"id": 1}]},)
    cursor.fetchall.return_value = [(1, "1/plan.pdf", "plan.pdf")]
    monkeypatch.setattr(enrollment_db, "get_connection", lambda: conn)
    body = {"p_owner": "00000000-0000-4000-8000-000000000001"}
    path = "rpc/tt_enrollment_state"
    if action:
        body.update(p_course_ids=[1], p_action=action)
        path = "rpc/tt_apply_enrollments"
    result = enrollment_db.enrollment_query("POST", path, body)
    args = cursor.execute.call_args_list[0].args
    assert args[1] == ((body["p_owner"], [1], action) if action else (body["p_owner"],))
    assert result["enrolled"][0]["syllabusName"] == "plan.pdf"
    conn.__exit__.assert_called_once_with(None, None, None)
    conn.close.assert_called_once()


def test_attachment_failure_rolls_back_and_hides_connection_details(monkeypatch):
    conn = MagicMock()
    cursor = conn.cursor.return_value.__enter__.return_value
    cursor.fetchone.return_value = ({"courses": [], "enrolled": []},)
    cursor.fetchall.side_effect = RuntimeError("secret-password")
    monkeypatch.setattr(enrollment_db, "get_connection", lambda: conn)
    with pytest.raises(HTTPException) as raised:
        enrollment_db.enrollment_query("POST", "rpc/tt_apply_enrollments",
                                      {"p_owner": "owner", "p_course_ids": [1], "p_action": "add"})
    assert raised.value.status_code == 503
    assert "secret-password" not in raised.value.detail
    assert conn.__exit__.call_args.args[0] is RuntimeError
    conn.close.assert_called_once()
