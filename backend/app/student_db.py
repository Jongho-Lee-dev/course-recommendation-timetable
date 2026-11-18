"""PostgreSQL adapter for the existing student authentication module."""
import logging
from contextlib import closing

from fastapi import HTTPException
from psycopg2 import IntegrityError, sql
from psycopg2.extras import RealDictCursor

from .database import get_connection


STUDENT_COLUMNS = {
    'owner', 'studentId', 'name', 'grade', 'departmentId', 'completedCredits',
    'graduationCredits', 'maxCredits', 'passwordHash',
}


def student_query(method, table, body=None, params=None):
    if table not in {'tt_students', 'tt_departments'}:
        raise ValueError('Unsupported student table')
    params = params or {}
    filters, values = [], []
    for field, value in params.items():
        if field in {'select', 'limit', 'order'}:
            continue
        if field not in {'owner', 'studentId'} or not value.startswith('eq.'):
            raise ValueError('Unsupported student filter')
        filters.append(sql.SQL('{}=%s').format(sql.Identifier(field)))
        values.append(value[3:])
    where = sql.SQL(' WHERE ') + sql.SQL(' AND ').join(filters) if filters else sql.SQL('')
    target = sql.Identifier('public', table)
    if method == 'GET':
        query = sql.SQL('SELECT * FROM {}').format(target) + where
        if table == 'tt_departments':
            query += sql.SQL(' ORDER BY id')
    elif method in {'POST', 'PATCH'} and table == 'tt_students':
        if not body or not set(body) <= STUDENT_COLUMNS:
            raise ValueError('Unsupported student fields')
        fields = list(body)
        if method == 'POST':
            query = sql.SQL('INSERT INTO {} ({}) VALUES ({}) RETURNING *').format(
                target, sql.SQL(',').join(map(sql.Identifier, fields)),
                sql.SQL(',').join(sql.Placeholder() for _ in fields))
            values = [body[field] for field in fields]
        else:
            if not filters:
                raise ValueError('Student update requires an owner filter')
            query = sql.SQL('UPDATE {} SET {}').format(target, sql.SQL(',').join(
                sql.SQL('{}=%s').format(sql.Identifier(field)) for field in fields))
            query += where + sql.SQL(' RETURNING *')
            values = [body[field] for field in fields] + values
    else:
        raise ValueError('Unsupported student operation')
    try:
        with closing(get_connection()) as conn:
            with conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, values)
                    return [dict(row) for row in cursor.fetchall()]
    except IntegrityError:
        raise HTTPException(409, '이미 등록된 학번이거나 학과 정보가 유효하지 않습니다.') from None
    except Exception as error:
        logging.getLogger(__name__).error('Student query failed (%s)', type(error).__name__)
        raise HTTPException(503, '학생 정보 DB 연결을 확인하세요.') from None
