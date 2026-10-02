import AdminCourses from '../components/course/AdminCourses';
import RegistrationSettings from "../components/course/RegistrationSettings";
import { useState } from "react";
import { BookOpen, Building2, Settings2, ShieldCheck } from "lucide-react";
import { departments } from "../data/departments";
import { mockCourses } from "../data/mockCourses";
import type { Department } from "../types/database";

const departmentFields = [
  { key: "collegeName", label: "단과대학" },
  { key: "facultyName", label: "학부" },
  { key: "majorName", label: "학과" },
] as const;

const categories = [
  { label: "학과", icon: Building2 },
  { label: "과목", icon: BookOpen },
  { label: "수강신청 설정", icon: Settings2 },
];

const inputClass = "w-full min-w-0 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[11px] text-[#5d6070] outline-none transition placeholder:text-[#a0a3b0] focus:border-[#a99aed] focus:ring-2 focus:ring-[#f0edff]";
const buttonClass = "cursor-pointer rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[11px] font-semibold text-[#5d6070] transition hover:border-[#a99aed] hover:bg-[#f0edff] hover:text-[#7658e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7658e9]";

export default function AdminPage() {
  const [departmentList, setDepartmentList] = useState<Department[]>(departments);
  const [departmentDraft, setDepartmentDraft] = useState<Department | null>(null);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);

  const cancelDepartmentEdit = () => {
    setDepartmentDraft(null);
    setIsAddingDepartment(false);
  };

  const saveDepartment = () => {
    if (!departmentDraft || !departmentDraft.majorName.trim()) return;

    const saved = {
      ...departmentDraft,
      collegeName: departmentDraft.collegeName?.trim() || undefined,
      facultyName: departmentDraft.facultyName?.trim() || undefined,
      majorName: departmentDraft.majorName.trim(),
    };
    setDepartmentList((prev) => isAddingDepartment
      ? [...prev, saved]
      : prev.map((department) => department.id === saved.id ? saved : department));
    cancelDepartmentEdit();
  };

  const visibleDepartments = isAddingDepartment && departmentDraft
    ? [...departmentList, departmentDraft]
    : departmentList;

  const [selectCategory, setSelectCategory] = useState("학과");
  const [courseList, setCourseList] = useState(mockCourses);

  return (
    <main className="min-h-screen bg-[#f5f6f9] px-4 py-6 font-['Pretendard',sans-serif] text-[11px] text-[#20212b] min-[1101px]:px-7">
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e3e4e9] bg-white p-5 shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#f0edff] text-[#7658e9]">
              <ShieldCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="!mb-1 !text-lg !font-bold">
                관리자 페이지
              </h2>
              <p className="text-[11px] leading-5 text-[#858796]">
                학과와 개설 과목, 수강신청 설정을 관리합니다.
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
            <nav aria-label="관리자 메뉴" className="flex flex-wrap gap-1 min-[701px]:flex-col">
              {categories.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selectCategory === label}
                  onClick={() => setSelectCategory(label)}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-3 text-left text-[11px] transition focus-visible:outline-2 focus-visible:outline-[#a99aed] ${selectCategory === label ? "bg-[#30313d] font-bold text-white" : "text-[#9698a4] hover:bg-[#30313d] hover:text-white"}`}
                >
                  <Icon size={15} aria-hidden="true" className={selectCategory === label ? "text-[#aa9cf3]" : "text-[#7d7f8c]"} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white p-4 shadow-[0_3px_14px_rgba(26,28,44,0.035)] min-[701px]:p-5">
            {selectCategory === "학과" && (
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf0] pb-4">
                  <div>
                    <h2 className="!mb-1 !text-sm !font-bold">
                      학과 수정하기
                    </h2>
                    <p className="text-[11px] text-[#858796]">
                      수정 버튼을 눌러 학과 정보를 변경하세요. 학과명은 필수입니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={departmentDraft !== null}
                    onClick={() => {
                      setDepartmentDraft({ id: Math.max(0, ...departmentList.map((dept) => dept.id)) + 1, collegeName: "", facultyName: "", majorName: "" });
                      setIsAddingDepartment(true);
                    }}
                    className="cursor-pointer rounded-md bg-[#7658e9] px-3 py-2 text-[11px] font-semibold text-white transition hover:bg-[#6546d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7658e9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + 학과 추가
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-[#e4e5eb]">
                  <div className="grid min-w-[720px] grid-cols-[52px_repeat(3,minmax(0,1fr))_128px] gap-4 border-b border-[#e4e5eb] bg-[#fafafd] px-4 py-3 text-[10px] font-semibold text-[#858796]">
                    <span>번호</span>
                    <span>단과대학</span>
                    <span>학부</span>
                    <span>학과</span>
                    <span>관리</span>
                  </div>

                  {visibleDepartments.map((dept) => (
                    <form
                      key={dept.id}
                      onSubmit={(event) => { event.preventDefault(); saveDepartment(); }}
                      className="grid min-w-[720px] grid-cols-[52px_repeat(3,minmax(0,1fr))_128px] items-center gap-4 border-b border-[#ececf0] px-4 py-3 text-[#5d6070] transition last:border-b-0 hover:bg-[#fafafd]"
                    >
                      <div>{isAddingDepartment && departmentDraft?.id === dept.id ? "신규" : dept.id}</div>
                      {departmentFields.map(({ key, label }) => (
                        <div key={key} className="min-w-0 break-words">
                          {departmentDraft?.id === dept.id ? (
                            <input
                              aria-label={`${dept.id}번 ${label}`}
                              placeholder={`${label} 입력`}
                              value={departmentDraft[key] ?? ""}
                              required={key === "majorName"}
                              pattern={key === "majorName" ? ".*\\S.*" : undefined}
                              title={key === "majorName" ? "공백이 아닌 학과명을 입력하세요." : undefined}
                              autoFocus={key === "majorName"}
                              onChange={(event) => setDepartmentDraft((prev) => prev ? { ...prev, [key]: event.target.value } : prev)}
                              className={inputClass}
                            />
                          ) : (dept[key] || <span className="text-[#a0a3b0]">—</span>)}
                        </div>
                      ))}
                      <div className="flex gap-2">
                        {departmentDraft?.id === dept.id ? (
                          <>
                            <button key="save" type="submit" className={`${buttonClass} !border-[#7658e9] !bg-[#7658e9] !text-white`}>
                              저장
                            </button>
                            <button key="cancel" type="button" onClick={cancelDepartmentEdit} className={buttonClass}>
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              key="edit"
                              type="button"
                              disabled={departmentDraft !== null}
                              onClick={(event) => {
                                event.preventDefault();
                                setDepartmentDraft({ ...dept });
                              }}
                              className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              수정
                            </button>
                            <button
                              key="delete"
                              type="button"
                              aria-label={`${dept.majorName} 삭제`}
                              onClick={() => setDepartmentList((prev) => prev.filter((item) => item.id !== dept.id))}
                              className={`${buttonClass} hover:!border-red-200 hover:!bg-red-50 hover:!text-red-600`}>
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </form>
                  ))}
                  {visibleDepartments.length === 0 && <p className="px-4 py-10 text-center text-[#858796]">
                    등록된 학과가 없습니다. 학과 추가 버튼으로 등록하세요.
                  </p>}
                </div>
                <p className="mt-3 text-[10px] text-[#858796]">
                  변경 사항은 현재 화면에만 적용되며, 새로고침하면 초기화됩니다.
                </p>
              </div>
            )}

            {selectCategory === "과목" && (
              <AdminCourses courses={courseList} departments={departmentList} onChange={setCourseList} />
            )}

            <div hidden={selectCategory !== "수강신청 설정"}>
              <RegistrationSettings />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
