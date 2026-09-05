
### 페이지
- Header: 상단 영역
- HomePage: 메인 페이지
- Footer: 하단 영역

### 적용된 라이브러리
- Zustand: 전역 상태 관리
- TanStack Query: 서버 상태 관리
- Axios: API 통신
- React Router DOM: 페이지 라우팅
- Lucide React: 아이콘
- Tailwind CSS: UI 스타일링
- Sonner: Toast 알림

### 구조 
- layout 폴더의 MainLayout에서 Header와 Footer를 상·하단 영역에 배치하며, 필요에 따라 조건부로 표시할 수 있음
- routes 폴더의 AppRoutes에서 라우팅을 관리

### 라우트 페이지 이동
- 사용자 상호작용에 의한 페이지 이동은 Link, 함수 호출(이벤트)에 의한 페이지 이동은 useNavigate를 사용