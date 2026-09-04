# 개인 조건 맞춤형 과목 추천 및 시간표 설계 웹 플랫폼

## 팀 정보

- **팀명:** 거의 다 됐죠

### 팀원

| 학번 | 이름 | 역할 |
| :---: | :--- | :---: |
| 2461071 | 이종호 | 팀장 |
| 2261064 | 김도현 | 부팀장 |
| 2161011 | 이정훈 | 팀원 |
| 2261066 | 오도현 | 팀원 |
| 2461084 | 흐엥 택 카잉 | 팀원 |

---

## 프로젝트 주소

- **GitHub:** [course-recommendation-timetable](https://github.com/Jongho-Lee-dev/course-recommendation-timetable)
- **서비스:** [서비스 바로가기](https://course-recommendation-timetable.vercel.app/)
- **Backend API:** [FastAPI 서버](https://course-recommendation-timetable.onrender.com)

---

## 프로젝트 내려받기

GitHub 저장소를 Clone하여 프로젝트를 로컬 환경에 내려받습니다.

```bash
git clone https://github.com/Jongho-Lee-dev/course-recommendation-timetable.git
cd course-recommendation-timetable
```

---

## 실행 조건

프로젝트를 실행하기 위해 프론트엔드와 백엔드의 환경을 각각 구성해야 합니다.

### 프론트엔드

`frontend` 폴더로 이동한 후 필요한 패키지를 설치하고 개발 서버를 실행합니다.

```bash
cd frontend
npm install
npm run dev
```

### 백엔드

`backend` 폴더로 이동한 후 Python 가상환경을 생성하고 필요한 패키지를 설치한 뒤 서버를 실행합니다.

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## 실행 확인

프론트엔드와 백엔드 서버가 정상적으로 실행되면 개발을 시작할 수 있습니다.

- **Frontend:** `npm run dev` 실행 후 터미널에 표시되는 주소로 접속
- **Backend:** `http://127.0.0.1:8000`
- **API 문서:** `http://127.0.0.1:8000/docs`