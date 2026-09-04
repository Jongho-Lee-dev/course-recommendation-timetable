import MainLayout from "../layout/MainLayout";
import HomePage from "../pages/HomePage";
import { Routes, Route } from "react-router-dom";


export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}