import MainLayout from "../layout/MainLayout";
import MainPage from "../pages/MainPage";
import UserPage from "../pages/UserPage";
import { useUserStore } from "../store/userStore";
import { Navigate, Routes, Route } from "react-router-dom";

export default function AppRoutes() {
  const user = useUserStore((state) => state.user);

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate to="/mainPage" replace />
          ) : (
            <UserPage />
          )
        }
      />
      
      <Route element={<MainLayout />}>
        <Route path="/mainPage" element={<MainPage />} />
      </Route>
    </Routes>
  );
}