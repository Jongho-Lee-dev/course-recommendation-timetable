import { Outlet } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import Sidebar from "../components/common/Sidebar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f5f6f9]">
      <Header />
      <div className="flex min-h-[calc(100vh-72px)] items-stretch">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Outlet />

        </div>

      </div>
      <Footer />
    </div>
  );
}
