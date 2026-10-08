import { NavLink, useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

const menu = [
  ["▦", "대시보드", "/mainPage"],
  ["⌕", "강의검색", "/courses"],
  ["◫", "나의 시간표", "/timetable"],
  ["✦", "AI 시간표 추천", "/ai"],
  ["♡", "관심강좌", "/favorites"],
  ["✓", "신청내역", "/history"],
  ["i", "공지사항", "/notices"],
] as const;

export default function Sidebar() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const resetUser = useUserStore((state) => state.reset);

  return (
    <aside className="hidden min-h-0 w-[210px] shrink-0 flex-col bg-[#20212a] px-3.5 py-6 text-[#d7d8df] min-[701px]:flex">
      <button
        type="button"
        onClick={() => navigate("/mainPage")}
        className="shrink-0 whitespace-nowrap px-3 text-left text-[15px] font-extrabold leading-tight tracking-[-0.5px] text-white"
      >
        수강 신청
      </button>
      <div className="shrink-0 px-3 pb-6 pt-1 text-[10px] text-[#858796]">
        2026학년도 2학기
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {menu.map(([icon, label, path]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `rounded-lg px-3 py-3 text-[11px] transition ${
                isActive
                  ? "bg-[#30313d] font-bold text-white"
                  : "text-[#9698a4] hover:bg-[#30313d] hover:text-white"
              }`
            }
          >
            <span className="mr-2 inline-block w-5 text-[#7d7f8c]">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="mt-auto shrink-0 border-t border-[#373843] pt-4">
          <div className="rounded-lg bg-[#2d2e38] px-3 py-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ece9ff] text-xs font-extrabold text-[#7658e9]">
                {user.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-[11px] font-bold text-white">
                  {user.name}
                </strong>
                <small className="mt-1 block truncate text-[9px] text-[#858796]">
                  {user.major} · {user.grade}학년
                </small>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#3b3c46] pt-3">
              <div>
                <span className="block text-[8px] text-[#858796]">학번</span>
                <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                  {user.studentId}
                </strong>
              </div>
              <div>
                <span className="block text-[8px] text-[#858796]">
                  이수 학점
                </span>
                <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                  {user.completedCredits}학점
                </strong>
              </div>
              <div>
                <span className="block text-[8px] text-[#858796]">
                  최대 신청
                </span>
                <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                  {user.maxCredits}학점
                </strong>
              </div>
              <div>
                <span className="block text-[8px] text-[#858796]">
                  졸업 필요
                </span>
                <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                  {user.graduationCredits}학점
                </strong>
              </div>
              <div className="col-span-2 mt-3 border-t border-[#3b3c46] pt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("학생 정보를 초기화하시겠습니까?")) {
                      resetUser();
                      navigate("/");
                    }
                  }}
                  className="w-full rounded-md bg-[#383944] py-1.5 text-[9px] font-medium text-[#a8a9b4] transition hover:bg-[#444550] hover:text-white"
                >
                  학생 정보 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
