import { NavLink, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, Home, Search, Sparkles } from "lucide-react";
import { useUserStore } from "../../store/userStore";

const links = [
  { to: "/mainPage", label: "홈", icon: Home },
  { to: "/courses", label: "강의검색", icon: Search },
  { to: "/timetable", label: "나의 시간표", icon: CalendarDays },
  { to: "/ai", label: "AI 추천", icon: Sparkles },
  { to: "/notices", label: "공지사항", icon: Bell },
];

export default function Header() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e7e8ee] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-6 px-4 min-[1101px]:px-7">
        <button
          type="button"
          onClick={() => navigate("/mainPage")}
          className="shrink-0 text-left"
          aria-label="수강신청 홈"
        >
          <div className="text-[17px] font-extrabold tracking-[-0.6px] text-[#242331]">
            수강 신청
          </div>
          <div className="mt-0.5 text-[9px] font-medium text-[#858796]">
            2026학년도 2학기
          </div>
        </button>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 min-[801px]:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                  isActive
                    ? "bg-[#f0edff] text-[#7658e9]"
                    : "text-[#666875] hover:bg-[#f5f5f8] hover:text-[#282735]"
                }`
              }
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden text-right min-[601px]:block">
            <div className="text-[10px] font-bold text-[#30313b]">
              {user?.name ?? "학생"}
            </div>
            <div className="text-[8px] text-[#999ba6]">
              {user ? `${user.major} · ${user.grade}학년` : "학생 정보"}
            </div>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#ece9ff] text-xs font-extrabold text-[#7658e9]">
            {user?.name?.slice(0, 1) ?? "학"}
          </div>
        </div>
      </div>

      <nav className="flex overflow-x-auto border-t border-[#f0f0f3] px-3 py-1 min-[801px]:hidden">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `shrink-0 rounded-md px-3 py-2 text-[10px] font-semibold ${
                isActive ? "text-[#7658e9]" : "text-[#777985]"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
