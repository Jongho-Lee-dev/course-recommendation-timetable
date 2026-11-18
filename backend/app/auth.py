"""학번/비밀번호 인증. 비밀번호는 salt가 포함된 scrypt 해시로만 저장합니다."""

import asyncio
import hashlib
import hmac
import secrets
import uuid
from fastapi import HTTPException
from pydantic import BaseModel, Field, ConfigDict
from .models import Student


class Signup(Student):
    model_config = ConfigDict(str_strip_whitespace=False)
    password: str = Field(min_length=8, max_length=128)


class Login(BaseModel):
    studentId: str = Field(min_length=1, max_length=30)
    password: str = Field(min_length=1, max_length=128)


def password_hash(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(
        password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1
    ).hex()
    return f"scrypt${salt}${digest}"


def password_matches(password, stored):
    try:
        kind, salt, _ = stored.split("$")
        return kind == "scrypt" and hmac.compare_digest(
            password_hash(password, salt), stored
        )
    except (ValueError, AttributeError, TypeError):
        return False


def public_student(row):
    return Student.model_validate(row).model_dump()


def install_auth(app, db, token, departments):
    @app.post("/api/auth/signup", status_code=201)
    async def signup(body: Signup):
        if body.departmentId not in {d["id"] for d in await departments()}:
            raise HTTPException(422, "학과코드 오류")
        existing = await db(
            "GET",
            "tt_students",
            params={"studentId": f"eq.{body.studentId}", "select": "owner"},
        )
        if existing:
            raise HTTPException(
                409,
                "이미 등록된 학번입니다. 기존 비밀번호 없는 학번은 관리자에게 문의하세요.",
            )
        payload = body.model_dump(exclude={"password"})
        payload.update(
            owner=str(uuid.uuid4()),
            passwordHash=await asyncio.to_thread(password_hash, body.password),
        )
        await db("POST", "tt_students", payload)
        return {"status": "created"}

    @app.post("/api/auth/login")
    async def login(body: Login):
        rows = await db(
            "GET",
            "tt_students",
            params={"studentId": f"eq.{body.studentId.strip()}", "limit": "1"},
        )
        row = rows[0] if rows else None
        # 존재하지 않는 학번도 같은 해시 계산을 거칩니다.
        stored = row.get("passwordHash") if row else None
        valid = await asyncio.to_thread(
            password_matches,
            body.password,
            stored or "scrypt$" + "00" * 16 + "$" + "00" * 64,
        )
        if not valid or not row or not stored:
            raise HTTPException(
                401,
                "학번 또는 비밀번호를 확인하세요. 기존 비밀번호 없는 학번은 관리자에게 문의하세요.",
            )
        return {"token": token("student", row["owner"]), "student": public_student(row)}
