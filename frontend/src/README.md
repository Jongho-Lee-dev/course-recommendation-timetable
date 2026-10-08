# 프런트엔드 소스 구조

- `admin/`: 관리자 전용 코드
  - `pages/AdminPage.tsx`: 관리자 화면
  - `components/`: 과목 관리, 과목 분류 편집, 학과 선택, 수강신청 설정
- `registration/`: 학생 수강신청 서비스 전용 코드
  - `pages/`: 학생정보 입력, 대시보드, 강의 검색, 시간표, 관심강좌, 신청내역 등
  - `components/`: 수강신청 목록, 강좌 표, 시간표 및 `layout/`의 헤더·사이드바·푸터
  - `layout/`: 학생 화면 공통 레이아웃
  - `store/`: 학생정보와 선택·관심강좌 상태
  - `data/`, `utils/`: 수강 대상 및 시간표 충돌 확인
- `shared/`: 관리자와 학생 화면에서 함께 사용하는 코드
  - `components/`: 과목 필터, 강의계획서 링크
  - `data/`, `types/`: 과목·학과 데이터, 분류·검색·정렬 로직과 공통 타입
  - `store/`, `hooks/`: 과목 카탈로그와 수강신청 기간·상태
- `routes/AppRoutes.tsx`: 관리자 및 학생 화면 라우팅
- `App.tsx`, `main.tsx`, `index.css`: 앱 진입점과 전역 스타일

관리자 전용 기능은 `admin`, 학생 전용 기능은 `registration`에 추가합니다.
양쪽에서 필요한 기능은 `shared`에 두며, `shared`는 전용 폴더를 import하지 않습니다.