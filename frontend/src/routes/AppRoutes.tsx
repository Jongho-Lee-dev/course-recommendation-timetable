import MainLayout from "../layout/MainLayout";
import HomePage from "../pages/HomePage";
import UserPage from "../pages/userPage";
import { Routes, Route } from "react-router-dom";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/user" element={<UserPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}