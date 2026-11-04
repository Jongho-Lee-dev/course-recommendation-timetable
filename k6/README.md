# 세팅

## k6 설치

k6 테스트를 진행하기 위해 PowerShell에서 다음 명령어를 실행합니다.

```bash
winget install k6 --source winget
```

## 버전확인

k6가 정상적으로 설치되었는지 확인하기 위해 VS Code의 터미널에서 다음 명령어를 실행합니다.

```bash
k6 version
```

## k6 실행 명령어

k6 테스트 스크립트를 실행할 때 다음 명령어를 사용합니다.

```bash
k6 run 파일이름
```

## 로컬 백엔드 부하 테스트 (Windows PowerShell)

프로젝트 루트에서 터미널 두 개를 엽니다. 기본 요청 주소는 `http://127.0.0.1:8000`입니다.

터미널 1 — 백엔드 실행 (`backend/.env`에 DB 연결 설정 필요):

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

터미널 2 — 프로젝트 루트에서 테스트 실행:

```powershell
k6 run .\k6\load_test.js
```

기본값은 가상 사용자 200명을 3분 동안 유지합니다. 각 사용자는 `/api/health`, `/api/courses` 조회 후 1초를 쉬고 반복합니다. 종료 시 진행 중인 요청에 최대 30초를 추가로 허용합니다.
백엔드는 로컬에서 실행되며 DB는 `backend/.env`에 설정된 Supabase를 사용합니다.
다른 주소는 `k6 run -e BASE_URL=http://127.0.0.1:8001 .\k6\load_test.js`처럼 지정합니다.
## 인원별 비교 실험

한 번 실행할 때 한 가지 인원만 3분간 유지합니다. 아래 명령은 `backend` 폴더 기준입니다.
백엔드는 별도 터미널에 켜두고, 테스트는 한 번에 하나씩 실행하세요.

| VUS | 실험 목적 |
|---:|---|
| 200 | 기존 결과와 비교하는 기준 부하 |
| 500 | 일부 학생 접속 가정 |
| 1000 | 접속 집중 가정 |
| 1800 | 한 학년 대부분이 동시에 이용하는 상황 가정 |

```powershell
k6 run -e VUS=200 --summary-export=baseline-200-run1.json ..\k6\load_test.js
k6 run -e VUS=500 --summary-export=baseline-500-run1.json ..\k6\load_test.js
k6 run -e VUS=1000 --summary-export=baseline-1000-run1.json ..\k6\load_test.js
k6 run -e VUS=1800 --summary-export=baseline-1800-run1.json ..\k6\load_test.js
```

프로젝트 루트에서는 스크립트 경로를 `.\k6\load_test.js`로 바꿉니다.
각 조건은 3회 반복하고 결과 파일명을 `run2`, `run3`으로 바꿔 덮어쓰기를 피하세요.
Redis 구현 후에는 `-e VARIANT=redis`, 로드밸런싱 구현 후에는 `-e VARIANT=redis-lb`로 결과 태그를 지정하고 파일명도 변경합니다.
`VARIANT`는 결과 구분용이며 서버 구성을 변경하지 않습니다. 서버 주소는 `BASE_URL`로 지정합니다.

`courses_duration`은 강의 목록 응답 시간이고 `http_req_duration`은 두 API를 합친 통계입니다.
기존 0~200명 증가 방식과 지금의 200명 고정 방식은 부하가 다르므로 기본 구성도 다시 측정해서 비교하세요.
1,800명은 실험 가정이며 학교의 실제 동시 접속자 측정값이 아닙니다.
로컬에서 부하 생성기와 서버를 함께 실행하면 CPU·메모리를 공유하므로 실험 환경과 자원 사용량도 기록하세요.