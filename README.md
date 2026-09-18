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

## 주요 기능

### 1. 학생 정보 입력

학생의 개인 조건을 입력하여 맞춤형 과목 추천과 시간표 설계에 활용합니다.

- 학년
- 학과 및 전공
- 이수 학점
- 최대 신청 가능 학점
- 이수 과목 정보

### 2. 수강신청 대시보드

수강신청에 필요한 정보를 한 화면에서 확인할 수 있습니다.

- 강의 검색
- 강의 필터링
- 주간 시간표 확인
- 현재 신청 강좌 확인
- 신청 학점 확인
- AI 시간표 추천

### 3. 수강신청

개설된 과목을 조회하고 실제 수강신청을 진행할 수 있습니다.

- 과목 검색
- 전공 및 교양 과목 필터링
- 학년 및 요일별 필터링
- 교수 검색
- 수강신청 및 취소
- 수강 정원 확인
- 신청 학점 확인

### 4. AI 시간표 추천

학생의 개인 조건과 수강 가능한 과목을 기반으로 AI를 활용하여 시간표를 추천합니다.

- 개인 조건 기반 과목 추천
- 수강 가능 과목 분석
- 시간표 구성
- 추천 시간표 확인

### 5. 관리자 과목 관리

관리자 페이지에서 수강신청에 필요한 과목 정보를 관리합니다.

- 과목 등록
- 과목 수정
- 과목 삭제
- 교수 정보 관리
- 강의 시간 및 강의실 관리
- 수강 정원 관리
- 대상 학년 및 전공 관리

---

## 페이지 구성

### 학생

```text
학생 정보 입력
      │
      ▼
수강신청 대시보드
      │
      ├── 강의 검색
      ├── 주간 시간표
      ├── 수강 신청 목록
      └── AI 시간표 추천
      │
      ▼
수강신청
```

### 관리자

```text
관리자
  │
  ▼
과목 관리
  ├── 과목 등록
  ├── 과목 수정
  ├── 과목 삭제
  └── 과목 정보 관리
```

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

---

## Redis

수강신청 과정에서 발생하는 다수 사용자의 동시 요청을 안정적으로 처리하기 위해 Redis를 활용했습니다.

### Redis 구성

- **로컬 개발 환경:** Docker Redis
- **배포 환경:** Upstash Redis
- **Backend:** Python + FastAPI
- **Redis Client:** `upstash-redis`

### Redis 적용 목적

수강신청은 여러 사용자가 동시에 같은 강의에 요청을 보낼 수 있기 때문에 강의 정원 관리 과정에서 동시성 문제가 발생할 수 있습니다.

Redis를 활용하여 수강 정원과 수강신청 요청을 처리하고, 다수 사용자가 동시에 접속하는 상황을 고려한 수강신청 처리 구조를 구현했습니다.

### 배포 환경

배포된 FastAPI 서버에서는 **Upstash Redis**를 사용합니다.

```text
FastAPI
   │
   ▼
Upstash Redis
   │
   ├── 수강 정원 관리
   └── 동시 수강신청 요청 처리
```

Redis 접속 정보는 환경변수로 관리하여 GitHub에 인증 정보가 노출되지 않도록 구성했습니다.

---

## k6

k6를 활용하여 다수 사용자의 동시 접속 상황을 가정한 부하 테스트를 진행합니다.

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

## 프로젝트 실행

### 프로젝트 내려받기

GitHub 저장소를 Clone하여 프로젝트를 로컬 환경에 내려받습니다.

```bash
git clone https://github.com/Jongho-Lee-dev/course-recommendation-timetable.git

cd course-recommendation-timetable
```

### Frontend

`frontend` 폴더로 이동한 후 필요한 패키지를 설치하고 개발 서버를 실행합니다.

```bash
cd frontend

npm install

npm run dev
```

### Backend

`backend` 폴더로 이동한 후 Python 가상환경을 생성하고 필요한 패키지를 설치한 뒤 서버를 실행합니다.

```powershell
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

### Redis

로컬 개발 환경에서는 Docker를 사용하여 Redis를 실행합니다.

```bash
docker run -d --name my-redis -p 6379:6379 redis
```

Redis 컨테이너가 생성된 이후에는 다음 명령어로 실행할 수 있습니다.

```bash
docker start my-redis
```

실행 여부는 다음 명령어로 확인합니다.

```bash
docker ps
```

### 환경변수

Backend 실행에 필요한 환경변수는 `backend/.env` 파일에서 관리합니다.

```env
UPSTASH_REDIS_REST_URL=발급받은_URL
UPSTASH_REDIS_REST_TOKEN=발급받은_토큰
```

> `UPSTASH_REDIS_REST_TOKEN`은 Redis 인증 정보이므로 GitHub에 업로드하지 않습니다.

---

## 실행 확인

프론트엔드와 백엔드 서버가 정상적으로 실행되면 개발 환경이 구성됩니다.

- **Frontend:** `npm run dev` 실행 후 터미널에 표시되는 주소로 접속
- **Backend:** `http://127.0.0.1:8000`
- **API 문서:** `http://127.0.0.1:8000/docs`