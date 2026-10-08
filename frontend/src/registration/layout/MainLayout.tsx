import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Sidebar from "../components/layout/Sidebar";

export default function MainLayout() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f5f6f9]">
      <Header />
      <div className="flex min-h-0 flex-1 items-stretch">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
          <Footer />
        </div>
      </div>
    </div>
  );
}
