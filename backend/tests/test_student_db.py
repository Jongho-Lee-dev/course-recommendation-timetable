from unittest.mock import MagicMock
import pytest
from app import student_db


def test_student_filter_is_parameterized(monkeypatch):
    conn = MagicMock()
    cursor = conn.cursor.return_value.__enter__.return_value
    cursor.fetchall.return_value = []
    monkeypatch.setattr(student_db, 'get_connection', lambda: conn)
    malicious = "' OR 1=1 --"
    assert student_db.student_query('GET', 'tt_students', params={'studentId': 'eq.' + malicious}) == []
    assert cursor.execute.call_args.args[1] == [malicious]
    conn.close.assert_called_once()


def test_unfiltered_profile_update_is_rejected():
    with pytest.raises(ValueError):
        student_db.student_query('PATCH', 'tt_students', {'name': 'changed'})
