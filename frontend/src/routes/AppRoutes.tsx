import MainLayout from "../layout/MainLayout";
import MainPage from "../pages/MainPage";
import UserPage from "../pages/UserPage";
import FeaturePage from "../pages/FeaturePage";
import { useUserStore } from "../store/userStore";
import { Navigate, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import AdminPage from "../pages/AdminPage";

export default function AppRoutes() {
  const user = useUserStore((state) => state.user);

  const protectedPage = (element: ReactNode) =>
    user ? element : <Navigate to="/" replace />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/mainPage" replace /> : <UserPage />} />

      <Route element={<MainLayout />}>
        <Route path="/mainPage" element={protectedPage(<MainPage />)} />
        <Route path="/courses" element={protectedPage(<FeaturePage type="courses" />)} />
        <Route path="/timetable" element={protectedPage(<FeaturePage type="timetable" />)} />
        <Route path="/ai" element={protectedPage(<FeaturePage type="ai" />)} />
        <Route path="/favorites" element={protectedPage(<FeaturePage type="favorites" />)} />
        <Route path="/history" element={protectedPage(<FeaturePage type="history" />)} />
        <Route path="/notices" element={protectedPage(<FeaturePage type="notices" />)} />
      </Route>


      <Route path="*" element={<Navigate to={user ? "/mainPage" : "/"} replace />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
