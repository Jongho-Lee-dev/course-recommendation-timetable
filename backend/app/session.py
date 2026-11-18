import base64, hashlib, hmac, json, os, time
from typing import Annotated
from fastapi import Header, HTTPException

def secret():
    s = os.getenv("SESSION_SECRET", "")
    if len(s) < 32 or s.startswith("CHANGE-"):
        raise HTTPException(503, "32자 이상의 SESSION_SECRET을 설정하세요.")
    return s.encode()


def token(role, subject):
    data = base64.urlsafe_b64encode(
        json.dumps(
            {"role": role, "sub": subject, "exp": int(time.time()) + 28800}
        ).encode()
    ).decode()
    sig = hmac.new(secret(), data.encode(), hashlib.sha256).hexdigest()
    return f"{data}.{sig}"


def claims(authorization: Annotated[str | None, Header()] = None):
    try:
        raw = authorization.removeprefix("Bearer ")
        data, sig = raw.split(".")
        if not hmac.compare_digest(
            hmac.new(secret(), data.encode(), hashlib.sha256).hexdigest(), sig
        ):
            raise ValueError()
        c = json.loads(base64.urlsafe_b64decode(data))
        if c["exp"] <= time.time():
            raise ValueError()
        return c
    except (AttributeError, ValueError, KeyError, TypeError):
        raise HTTPException(401, "로그인이 필요하거나 세션이 만료되었습니다.")


