# Supabase DB 공유 및 초기 설치

새 Supabase 프로젝트의 SQL Editor에서 `setup.sql` 전체를 붙여넣고 실행하세요.
이 파일은 001~007 SQL을 실행 순서대로 합친 **신규 프로젝트용** 설치 파일입니다.
개별 SQL을 실행했다면 통합 파일을 다시 실행할 필요가 없습니다.
기존 DB에 실행하면 시드의 학과/과목 정보가 갱신되므로 새 프로젝트에 사용하세요.

## 포함 내용

- 학과, 과목, 개설강좌, 시간표, 학생, 수강신청 테이블
- 수강신청 처리 함수, 잔여석 뷰, RLS 및 서버 전용 접근권한
- 학생 비밀번호 해시 컬럼
- 강의계획서 메타데이터와 비공개 `course-syllabi` Storage 버킷
- 공지 API가 사용하는 `notice` 테이블 (현재 코드의 조회/입력 필드 기준)
- 저장소의 초기 데이터: 학과 13개, 강좌 40개

운영 DB를 덤프한 파일은 아닙니다. 실제 DB에서 변경한 학과/강좌,
학생 계정, 비밀번호, 수강신청 내역, 공지, 업로드한 PDF는 포함되지 않습니다.
학생은 앱에서 새로 등록하고 PDF는 관리자 화면에서 다시 첨부하세요.
운영 DB에서 별도로 추가한 테이블/정책도 포함되지 않습니다.

## 앱 연결

같은 프로젝트 코드를 사용하고 `backend/.env`에 새 프로젝트의 값을 설정하세요.

```dotenv
DATABASE_URL=postgresql://USER:URL_ENCODED_PASSWORD@HOST:5432/postgres
SUPABASE_URL=https://PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
SESSION_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

`DATABASE_URL`은 새 프로젝트의 연결 문자열로 설정하세요. 비밀번호의 특수문자는
URL 인코딩해야 합니다. `DATABASE_URL`과 `SUPABASE_URL`은 같은 프로젝트를 가리켜야 합니다.
service role 키는 백엔드 전용이며 프런트엔드에 넣지 않습니다.
프런트엔드 `frontend/.env`에는 `VITE_API_BASE_URL=http://localhost:8000`을 설정합니다.
서버 실행 방법은 `../backend/README.md`를 참고하세요.
SQL 설치만으로 앱 서버나 Redis 등의 외부 서비스가 생성되지는 않습니다.

## 설치 확인

```sql
select count(*) as departments from public.tt_departments; -- 13
select count(*) as courses from public.tt_open_courses where active; -- 40
select * from public.tt_course_seats order by "openCourseId";
select id, public from storage.buckets where id = 'course-syllabi';
```

`setup.sql`은 001~007 원본을 합친 배포본이므로 원본 SQL 변경 시 함께 갱신하세요.
