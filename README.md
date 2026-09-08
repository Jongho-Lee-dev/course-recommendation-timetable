# 개인 조건 맞춤형 과목 추천 및 시간표 설계 웹 플랫폼

## 팀 정보

- **팀명:** 거의 다 됐죠

### 팀원

| 학번 | 이름 | 역할 |
| :---: | :--- | :--- |
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

프로젝트를 실행하기 위해 프론트엔드와 백엔드 환경을 각각 구성해야 합니다.

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

프론트엔드와 백엔드 서버가 정상적으로 실행되면 개발 환경이 구성됩니다.

- **Frontend:** `npm run dev` 실행 후 터미널에 표시되는 주소로 접속
- **Backend:** http://127.0.0.1:8000
- **API 문서:** http://127.0.0.1:8000/docs

---

## Redis

본 프로젝트는 Redis를 Docker 컨테이너로 실행합니다.

### 1. Redis 컨테이너 생성

터미널에서 다음 명령어를 실행합니다.

```bash
docker run -d --name my-redis -p 6379:6379 redis
```

### 2. Redis 컨테이너 실행

Docker Desktop의 **Containers** 메뉴에서 `my-redis` 컨테이너를 확인합니다.

컨테이너가 정지되어 있다면 ▶ 버튼을 클릭하여 실행합니다.

또는 터미널에서 다음 명령어를 실행합니다.

```bash
docker start my-redis
```

### 3. Redis 실행 확인

다음 명령어를 실행하여 `my-redis` 컨테이너가 실행 중인지 확인합니다.

```bash
docker ps
```

`my-redis`가 목록에 표시되면 정상적으로 실행된 것입니다.

### 4. Redis 컨테이너 종료

Redis를 사용하지 않을 때는 다음 명령어로 컨테이너를 종료할 수 있습니다.

```bash
docker stop my-redis
```

---

## k6

k6를 활용하여 다수 사용자의 동시 접속 상황을 가정한 부하 테스트를 진행합니다.

### k6 설치

Windows PowerShell에서 다음 명령어를 실행합니다.

```powershell
winget install k6 --source winget
```

### 버전 확인

k6가 정상적으로 설치되었는지 확인합니다.

```bash
k6 version
```

### k6 실행

k6 테스트 스크립트를 실행할 때 다음 명령어를 사용합니다.

```bash
k6 run 파일이름
```

테스트 결과는 터미널에서 확인할 수 있습니다.

---

## Database

본 프로젝트는 **Supabase PostgreSQL**을 데이터베이스로 사용합니다.

### ERD

<img src="./docs/ERDDiagram.png" width="600">

---

## 주요 기능

### 과목 검색 및 조회

- 강의 정보 조회
- 강의 검색
- 조건별 강의 필터링

### AI 기반 과목 추천

- 사용자의 희망 조건 분석
- 강의 정보 비교
- 개인 조건에 맞는 과목 추천

### 시간표 설계

- 수강할 과목 선택
- 선택한 과목을 기반으로 시간표 구성
- 시간표 정보 관리

### 수강신청 처리

- Redis를 활용한 실시간 수강 정원 관리
- 동시 수강신청 요청 처리
- 대규모 트래픽 상황을 고려한 안정적인 수강신청 처리

### 성능 테스트

- k6를 활용한 부하 테스트
- 동시 접속 상황에서의 서버 성능 확인
- 테스트 결과를 기반으로 서버 및 API 성능 비교·분석

---

## 기술 스택

### Frontend

- React
- TypeScript
- Zustand

### Backend

- Python
- FastAPI

### AI

- Gemini Flash API

### Database / In-Memory

- PostgreSQL
- Supabase
- Redis

### Test / Infrastructure

- k6
- Docker

### Development Tools

- VS Code
- Git
- GitHub