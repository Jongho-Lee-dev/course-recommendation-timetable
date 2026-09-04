# 개인 조건 맞춤형 과목 추천 및 시간표 설계 웹 플랫폼



# 프로젝트 내려받기

GitHub 저장소를 Clone하여 프로젝트를 로컬 환경에 내려받습니다.

```bash
git clone https://github.com/Jongho-Lee-dev/course-recommendation-timetable.git
cd course-recommendation-timetable
```

# 실행 조건
프로젝트를 실행하기 위해 프론트엔드와 백엔드의 환경을 각각 구성해야 합니다.

## 프론트 엔드
frontend 폴더로 이동한 후 필요한 패키지를 설치하고 개발 서버를 실행합니다.
```bash
cd frontend
npm install
npm run dev
```

## 백엔드
backend 폴더로 이동한 후 Python 가상환경을 생성하고 필요한 패키지를 설치한 뒤 서버를 실행합니다.
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```