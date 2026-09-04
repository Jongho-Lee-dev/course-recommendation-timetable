# 개인 조건 맞춤형 과목 추천 및 시간표 설계 웹 플랫폼


# 실행 조건

프로젝트를 실행하기 위해 프론트엔드와 백엔드의 환경을 각각 구성해야 합니다.

## 프론트 엔드
```text
cd frontend
npm install
npm run dev
```

## 백엔드
```text
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```