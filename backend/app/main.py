from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.notice import router as notice_router

app = FastAPI()

# 프론트엔드(React)에서 호출할 수 있도록 CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 공지사항 API 등록
app.include_router(notice_router)


@app.get("/")
def root():
    return {"message": "Hello World"}