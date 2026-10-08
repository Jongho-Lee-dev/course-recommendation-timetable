import MainLayout from "../registration/layout/MainLayout";
import MainPage from "../registration/pages/MainPage";
import UserPage from "../registration/pages/UserPage";
import CourseSearchPage from "../registration/pages/CourseSearchPage";
import TimetablePage from "../registration/pages/TimetablePage";
import FavoritesPage from "../registration/pages/FavoritesPage";
import HistoryPage from "../registration/pages/HistoryPage";
import AIRecommendationPage from "../registration/pages/AIRecommendationPage";
import NoticesPage from "../registration/pages/NoticesPage";
import { useUserStore } from "../registration/store/userStore";
import { Navigate, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import AdminPage from "../admin/pages/AdminPage";

export default function AppRoutes() {
  const user = useUserStore((state) => state.user);

  const protectedPage = (element: ReactNode) =>
    user ? element : <Navigate to="/" replace />;

  return (
    <Routes>
      {/* 로그인 / 사용자 페이지 */}
      <Route
        path="/"
        element={user ? <Navigate to="/mainPage" replace /> : <UserPage />}
      />

      {/* 메인 서비스 영역 */}
      <Route element={<MainLayout />}>
        {/* 대시보드 */}
        <Route path="/mainPage" element={protectedPage(<MainPage />)} />

        {/* 강의 검색 */}
        <Route path="/courses" element={protectedPage(<CourseSearchPage />)} />

        {/* 나의 시간표 */}
        <Route path="/timetable" element={protectedPage(<TimetablePage />)} />

        {/* AI 시간표 추천 */}
        <Route path="/ai" element={protectedPage(<AIRecommendationPage />)} />

        {/* 관심 강좌 */}
        <Route path="/favorites" element={protectedPage(<FavoritesPage />)} />

        {/* 신청 내역 */}
        <Route path="/history" element={protectedPage(<HistoryPage />)} />

        {/* 공지사항 */}
        <Route path="/notices" element={protectedPage(<NoticesPage />)} />
      </Route>

      {/* 관리자 */}
      <Route path="/admin" element={<AdminPage />} />

      {/* 존재하지 않는 경로 */}
      <Route
        path="*"
        element={<Navigate to={user ? "/mainPage" : "/"} replace />}
      />
    </Routes>
  );
}
