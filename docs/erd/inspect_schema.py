"""Read PostgreSQL schema metadata only. Never reads application records."""
import json
import os
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / 'backend' / '.env')
OUT = Path(__file__).resolve().parent

QUERIES = {
    'relations': """
        SELECT n.nspname AS schema_name, c.relname AS name, c.relkind AS kind
        FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
        ORDER BY c.relname
    """,
    'columns': """
        SELECT c.relname AS table_name, a.attname AS column_name,
               a.attnum AS ordinal_position,
               pg_catalog.format_type(a.atttypid,a.atttypmod) AS data_type,
               a.attnotnull AS not_null,
               pg_catalog.pg_get_expr(d.adbin,d.adrelid) AS default_expression,
               a.attidentity AS identity_kind, a.attgenerated AS generated_kind
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid
        LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
        WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
          AND a.attnum>0 AND NOT a.attisdropped
        ORDER BY c.relname,a.attnum
    """,
    'constraints': """
        SELECT c.relname AS table_name, con.conname AS name, con.contype AS type,
               pg_catalog.pg_get_constraintdef(con.oid,true) AS definition,
               ARRAY(SELECT a.attname FROM unnest(con.conkey) WITH ORDINALITY k(num,ord)
                     JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.num
                     ORDER BY k.ord) AS columns,
               rn.nspname AS referenced_schema, rc.relname AS referenced_table,
               ARRAY(SELECT a.attname FROM unnest(con.confkey) WITH ORDINALITY k(num,ord)
                     JOIN pg_catalog.pg_attribute a ON a.attrelid=rc.oid AND a.attnum=k.num
                     ORDER BY k.ord) AS referenced_columns
        FROM pg_catalog.pg_constraint con
        JOIN pg_catalog.pg_class c ON c.oid=con.conrelid
        JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
        LEFT JOIN pg_catalog.pg_class rc ON rc.oid=con.confrelid
        LEFT JOIN pg_catalog.pg_namespace rn ON rn.oid=rc.relnamespace
        WHERE n.nspname='public' ORDER BY c.relname,con.conname
    """,
    'views': """SELECT viewname AS name, definition FROM pg_catalog.pg_views
                WHERE schemaname='public' ORDER BY viewname""",
    'indexes': """SELECT tablename AS table_name,indexname AS name,indexdef AS definition
                  FROM pg_catalog.pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname""",
}

def main():
    if not os.getenv('DATABASE_URL'):
        print('SCHEMA_UNAVAILABLE: DATABASE_URL is not configured')
        return 2
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'], sslmode='require',
                               connect_timeout=10, application_name='erd_metadata_readonly')
        conn.set_session(readonly=True, autocommit=False)
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("SET LOCAL statement_timeout = '15000ms'")
                result = {}
                for name, query in QUERIES.items():
                    cur.execute(query)
                    result[name] = [dict(row) for row in cur.fetchall()]
            conn.rollback()
        finally:
            conn.close()
        (OUT / 'schema-metadata.json').write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps({'status': 'verified_readonly', 'relations': result['relations'],
                          'foreign_keys': [c for c in result['constraints'] if c['type']=='f']},
                         ensure_ascii=False, indent=2))
        return 0
    except Exception as error:
        # Do not print exception text: drivers may include connection details.
        print('SCHEMA_UNAVAILABLE: ' + type(error).__name__)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
