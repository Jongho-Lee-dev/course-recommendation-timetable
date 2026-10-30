import AdminNotices from "../components/AdminNotices";
import AdminCourses from "../components/AdminCourses";
import RegistrationSettings from "../components/RegistrationSettings";
import { useState } from "react";
import AdminDepartments from "../components/AdminDepartments";
import { departments } from "../../shared/data/departments";
import {
  Bell,
  BookOpen,
  Building2,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";
import type { Department } from "../../shared/types/database";

const categories = [
  { label: "학과", icon: Building2 },
  { label: "과목", icon: BookOpen },
  { label: "공지사항", icon: Bell },
  { label: "수강신청 설정", icon: Settings2 },
];

export default function AdminPage() {
  const [departmentList, setDepartmentList] =
    useState<Department[]>(departments);

  const [selectCategory, setSelectCategory] = useState("학과");
  const courseList = useCourseCatalogStore((state) => state.courses);
  const setCourseList = useCourseCatalogStore((state) => state.setCourses);

  return (
    <main className="min-h-screen bg-[#f5f6f9] px-4 py-6 font-['Pretendard',sans-serif] text-[11px] text-[#20212b] min-[1101px]:px-7">
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e3e4e9] bg-white p-5 shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0edff] text-[#7658e9]">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="!mb-1 !text-lg !font-bold">관리자 페이지</h2>
              <p className="text-[11px] leading-5 text-[#858796]">
                학과와 개설 과목, 공지사항, 수강신청 설정을 관리합니다.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="rounded-lg border border-[#e4e5eb] px-3 py-2 text-[#777985]">
              학과
              <strong className="ml-2 text-[#7658e9]">
                {departmentList.length}
              </strong>
            </span>
            <span className="rounded-lg border border-[#e4e5eb] px-3 py-2 text-[#777985]">
              개설 과목
              <strong className="ml-2 text-[#7658e9]">
                {courseList.length}
              </strong>
            </span>
          </div>
        </header>

        <section className="grid items-start gap-4 min-[701px]:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="rounded-xl bg-[#20212a] p-3.5 min-[701px]:py-5">
            <p className="mb-3 px-3 text-[10px] font-semibold text-[#858796]">
              관리 메뉴
            </p>
            <nav
              aria-label="관리자 메뉴"
              className="flex flex-wrap gap-1 min-[701px]:flex-col"
            >
              {categories.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selectCategory === label}
                  onClick={() => setSelectCategory(label)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-left text-[11px] transition focus-visible:outline-2 focus-visible:outline-[#a99aed] ${selectCategory === label ? "bg-[#30313d] font-bold text-white" : "text-[#9698a4] hover:bg-[#30313d] hover:text-white"}`}
                >
                  <Icon
                    size={15}
                    aria-hidden="true"
                    className={
                      selectCategory === label
                        ? "text-[#aa9cf3]"
                        : "text-[#7d7f8c]"
                    }
                  />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white p-4 shadow-[0_3px_14px_rgba(26,28,44,0.035)] min-[701px]:p-5">
            <div hidden={selectCategory !== categories[0].label}>
              <AdminDepartments
                departments={departmentList}
                onChange={setDepartmentList}
              />
            </div>

            {selectCategory === "과목" && (
              <AdminCourses
                courses={courseList}
                departments={departmentList}
                onChange={setCourseList}
              />
            )}

            <div hidden={selectCategory !== "공지사항"}>
              <AdminNotices />
            </div>

            <div hidden={selectCategory !== "수강신청 설정"}>
              <RegistrationSettings />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
