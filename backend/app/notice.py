from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.supabase_client import supabase

router = APIRouter(prefix="/notices", tags=["notice"])


# ---------- 요청 데이터 모델 ----------
class NoticeCreate(BaseModel):
    title: str
    content: str
    author: Optional[str] = "관리자"
    is_pinned: Optional[bool] = False


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    is_pinned: Optional[bool] = None


# ---------- 공지 전체 조회 ----------
@router.get("")
def list_notices():
    res = (
        supabase.table("notice")
        .select("*")
        .order("is_pinned", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


# ---------- 공지 1개 조회 ----------
@router.get("/{notice_id}")
def get_notice(notice_id: int):
    res = supabase.table("notice").select("*").eq("id", notice_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="공지를 찾을 수 없습니다.")
    return res.data[0]


# ---------- 공지 등록 ----------
@router.post("", status_code=201)
def create_notice(notice: NoticeCreate):
    res = supabase.table("notice").insert(notice.model_dump()).execute()
    return res.data[0]


# ---------- 공지 수정 ----------
@router.patch("/{notice_id}")
def update_notice(notice_id: int, notice: NoticeUpdate):
    data = {k: v for k, v in notice.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="수정할 내용이 없습니다.")
    res = supabase.table("notice").update(data).eq("id", notice_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="공지를 찾을 수 없습니다.")
    return res.data[0]


# ---------- 공지 삭제 ----------
@router.delete("/{notice_id}")
def delete_notice(notice_id: int):
    res = supabase.table("notice").delete().eq("id", notice_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="공지를 찾을 수 없습니다.")
    return {"message": "삭제되었습니다.", "id": notice_id}
