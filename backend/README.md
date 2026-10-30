# FastAPI + Supabase 백엔드

첨부 요청 범위: 엑셀 일괄 저장, 관리자 과목 추가/수정, 과목 조회, 학생 정보 저장.
기존 프론트 화면과 엑셀 직접 저장 기능을 유지하고 API 호출에 필요한 부분만 연결했습니다. 관리자 인증은 사용자 요청으로 제거했습니다.

## 1. Supabase SQL 실행

프로젝트의 SQL Editor에서 다음을 **순서대로** 실행하세요.

1. `supabase/001_schema.sql`: 테이블, 제약조건, 트랜잭션 함수, 접근권한
2. `supabase/002_seed.sql`: 원본 18개 + 추가 가데이터 22개 = **강좌 40개**, 학과 13개

강좌는 학수번호+분반 기준입니다. 자료구조는 월/수 두 줄이므로 엑셀 데이터 행은 41행입니다.
원본 `과목 데이터.xlsx`는 수정하지 않았습니다. 제공한 `과목_가데이터_40개.xlsx`를 사용하세요.
시드는 다시 실행하면 과목 기본정보를 시드 값으로 갱신하므로 초기 설치 때만 실행하는 것을 권장합니다.
시드 실행은 기존 다른 강좌를 비활성화하지 않습니다. 빈 새 테이블에서 정확히 40개입니다.

기존 팀 DB 구조/접속 정보가 제공되지 않아 `tt_` 접두사 테이블을 사용합니다.
`shared/types/database.ts`의 전체 학사 DB 설계를 모두 구현한 것은 아닙니다.
현재 학기 하나를 지원하며 과목 원장/개설강좌/시간표/학과는 분리했습니다.
분류 경로와 제외 학과 목록은 개설강좌 배열 컬럼에 저장합니다.
기존 팀 테이블이 있으면 이 SQL을 실행하기 전에 테이블 매핑을 협의하세요.

## 2. 서버 환경변수

로컬 설정은 `backend/.env`에서 관리합니다. Redis 설정은 유지하고, 아래 DB 연결 및 세션/CORS 변수를 설정하세요. `.env`는 Git에서 제외됩니다. 배포 시에는 Render Environment에 별도로 등록하세요.

```dotenv
SUPABASE_URL=https://프로젝트ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=서버에서만_사용하는_service_role_키
SESSION_SECRET=32자이상의임의문자열
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`service_role` 키는 서버 전용입니다. 프론트 `VITE_` 변수에 넣거나 Git에 올리지 마세요.
프론트 팀은 백엔드 API 주소만 받아 작업할 수 있습니다. 팀원 전체에게 DB 비밀키를 공유할 필요가 없습니다.

## 3. 실행 (Windows PowerShell)

프로젝트 루트에서:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

별도 터미널:

```powershell
cd frontend
npm ci
npm run dev
```

`frontend/.env`의 `VITE_API_BASE_URL`에 백엔드 주소를 설정하세요. 로컬 백엔드는 `http://localhost:8000`, 배포 백엔드는 `https://course-recommendation-timetable.onrender.com`입니다. Vercel에서는 같은 변수를 Environment에 등록하고 재배포하세요. 백엔드 `CORS_ORIGINS`에는 접속할 프론트 주소를 쉼표로 구분해 등록합니다.
서버 문서: http://localhost:8000/docs
DB 연결 확인: http://localhost:8000/api/health

Docker로 서버 실행할 수도 있습니다:

```powershell
docker build -t course-api backend
docker run --env-file backend/.env -p 8000:8000 course-api
```

## 4. 기존 화면에서 사용

- 이름에 `admin` 또는 `ADMIN` 입력 → 저장 → 기존 관리자 페이지 → 관리자 화면으로 바로 이동.
- 과목 추가/수정: 기존처럼 ‘저장할 엑셀 선택’으로 **40개짜리 엑셀** 선택 후 저장. 로컬 엑셀을 갱신하고 API를 통해 DB에도 저장합니다.
- 엑셀 데이터 적용: 파일 검증 및 미리보기 후 적용하면 서버가 다시 검증하고 한 번의 DB 트랜잭션으로 전체 목록을 반영합니다.
- 파일에 없는 강좌는 삭제 대신 비활성화됩니다. 같은 학수번호/분반은 기존 ID를 유지합니다.
- 과목 검색/시간표 추천은 DB 목록을 사용합니다. 다른 브라우저는 새로고침하면 최신 목록을 읽습니다.
- 학생 정보 저장은 DB 성공 후 기존 다음 화면으로 이동합니다.
- 공지 화면은 원본의 샘플 데이터 동작을 유지합니다. 실제 DB/API 연결은 공지 담당자 작업에서 진행합니다.
- DB 최신 목록을 별도 엑셀로 받는 API도 제공합니다: `GET /api/admin/courses.xlsx` (관리자 인증 없음).

로컬 파일과 원격 DB를 하나의 트랜잭션으로 묶을 수는 없습니다. 로컬 파일 저장 뒤 DB 저장이 실패하면 화면에 구분해서 알립니다. 이때 해당 파일을 ‘엑셀 데이터 적용’으로 다시 업로드하면 복구할 수 있습니다. 서버는 로컬 파일을 백그라운드에서 자동 수정하지 않습니다.
기존 삭제 버튼은 원래 로컬 엑셀을 수정하지 않았으며, 이 동작은 유지했습니다. DB에서 삭제한 과목이 오래된 엑셀에 남아 있으면 다시 업로드할 때 복원될 수 있으므로 최신 엑셀을 사용하세요.

## 5. 구현 범위와 인증

학생 입력은 기존 화면을 유지한 **시연용 프로필 등록**입니다. 첫 저장 시 브라우저 세션을 발급하고, 그 세션 소유 정보만 수정할 수 있습니다. 학번만 입력해서 다른 프로필을 덮어쓸 수 없습니다. 이미 등록한 학번을 새 브라우저에서 입력하면 중복 오류가 납니다. 정식 학교 로그인/본인확인/계정 복구는 별도 구현 대상입니다.
관리자 비밀번호 입력과 관리자 API 토큰 검사는 제거했습니다. 서버에 접근할 수 있는 사람은 관리자 API를 호출할 수 있습니다. 학생 프로필 소유 세션은 그대로 유지하므로 SESSION_SECRET은 필요합니다. 기존 .env에 ADMIN_PASSWORD가 있어도 사용하지 않습니다.
프론트가 DB를 직접 수정하지 못하도록 RLS 및 권한을 제한했습니다.

기존 학과 편집, 신청기간 설정, 강의계획서 파일, 관심과목, 장바구니/시간표, 수강신청 확정 처리는 이번 서버 영속화 범위에 포함하지 않았습니다. 기존 프론트 동작을 유지합니다. 수강 정원 동시성/학교 학사 검증/AI 모델 서버는 별도 작업입니다.

## 6. 검증

```powershell
cd backend
python -m pytest tests -q
```

엑셀 원본 보존, 40개 시드와 배포 엑셀 일치, 잘못된 파일 차단, 권한 차단, 일괄 저장 호출, 학생 입력 검증을 확인합니다.
프론트: `npm run build`, `npm run lint`.
SQL은 별도 PostgreSQL 호환 엔진에서 스키마/시드/전체목록 갱신/ID 유지/롤백/익명 접근 차단을 검증했습니다. 실제 Supabase 프로젝트 연결 검증은 사용자 환경변수 설정 뒤 해야 합니다.

SQL 테스트를 직접 재실행하려면 프로젝트 루트에서 `cd supabase/tests`, `npm install`, `npm test`를 실행하세요. 테스트는 메모리 내 PostgreSQL에서 실행하며 실제 Supabase 데이터를 수정하지 않습니다.

참고한 공식 문서: https://supabase.com/docs/guides/database/postgres/row-level-security, https://supabase.com/docs/guides/database/functions
