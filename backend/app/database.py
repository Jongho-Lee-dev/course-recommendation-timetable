
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

# backend/.env 파일 불러오기
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL이 설정되지 않았습니다.")

    return psycopg2.connect(
        DATABASE_URL,
        sslmode="require",
        connect_timeout=10,
    )
