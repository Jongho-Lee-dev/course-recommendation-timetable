import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Save, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../../shared/api";
import { departments } from "../../shared/data/departments";
import { toUser, type StudentProfile } from "../../shared/studentSession";
import { useUserStore } from "../store/userStore";

type SavedStudent = { token: string; student: StudentProfile };

const fieldClass = "mt-2 w-full rounded-xl border border-[#e3e5ed] bg-white px-3.5 py-3 text-sm text-[#272638] outline-none transition placeholder:text-[#a6a8b5] focus:border-[#8a78ee] focus:ring-4 focus:ring-[#8a78ee]/10";
const labelClass = "block text-xs font-bold text-[#555667]";

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [name, setName] = useState(user?.name ?? "");
  const [grade, setGrade] = useState(String(user?.grade ?? 1));
  const [departmentId, setDepartmentId] = useState(String(user?.departmentId ?? departments.find((d) => d.majorName === user?.major)?.id ?? departments[0]?.id ?? 1));
  const [completedCredits, setCompletedCredits] = useState(String(user?.completedCredits ?? 0));
  const [graduationCredits, setGraduationCredits] = useState(String(user?.graduationCredits ?? 130));
  const [maxCredits, setMaxCredits] = useState(String(user?.maxCredits ?? 18));
  const [saving, setSaving] = useState(false);
  const selectedDepartment = useMemo(() => departments.find((d) => d.id === Number(departmentId)), [departmentId]);

  if (!user) {
    return <main className="mx-auto w-full max-w-3xl p-6"><div className="rounded-2xl border border-[#e5e6ed] bg-white p-8 text-center"><p className="font-bold">로그인이 필요합니다.</p><button className="mt-4 rounded-xl bg-[#7560e8] px-4 py-2 text-sm font-bold text-white" onClick={() => navigate("/")}>로그인으로 이동</button></div></main>;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const completed = Number(completedCredits);
    const graduation = Number(graduationCredits);
    const max = Number(maxCredits);
    if (!name.trim()) return toast.error("이름을 입력해주세요.");
    if (!selectedDepartment) return toast.error("학과를 선택해주세요.");
    if (completed < 0 || graduation <= 0 || max <= 0 || completed > graduation) return toast.error("학점 값을 확인해주세요.");
    setSaving(true);
    try {
      const result = await api<SavedStudent>("/students", {
        method: "POST",
        body: JSON.stringify({
          studentId: user.studentId,
          name: name.trim(),
          grade: Number(grade),
          departmentId: Number(departmentId),
          completedCredits: completed,
          graduationCredits: graduation,
          maxCredits: max,
        }),
      }, "student");
      if (result.token) sessionStorage.setItem("student-token", result.token);
      setUser(toUser(result.student));
      toast.success("개인정보가 저장되었습니다.");
      navigate("/mainPage");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-7 text-[#252638] sm:px-7">
      <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#77798a] transition hover:text-[#6651d8]"><ArrowLeft size={15} /> 이전 페이지</button>
      <div className="mb-6 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eeeaff] text-[#765fe7]"><UserRound size={22} /></div>
        <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8979e6]">MY ACCOUNT</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight">내 정보 수정</h1><p className="mt-2 text-sm text-[#858797]">개인정보와 수강 신청에 사용되는 학점 정보를 관리합니다.</p></div>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-2xl border border-[#e6e7ee] bg-white p-5 shadow-[0_4px_18px_rgba(25,27,45,.03)] sm:p-7">
          <div className="mb-6 border-b border-[#f0f0f4] pb-4"><h2 className="text-sm font-extrabold">기본 정보</h2><p className="mt-1 text-xs text-[#9294a2]">학번은 계정 식별 정보이므로 이 화면에서 변경할 수 없습니다.</p></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>이름<input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></label>
            <label className={labelClass}>학번<input className={`${fieldClass} cursor-not-allowed bg-[#f6f6f9] text-[#8b8d9b]`} value={user.studentId} readOnly /></label>
            <label className={labelClass}>학년<select className={fieldClass} value={grade} onChange={(e) => setGrade(e.target.value)}>{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}학년</option>)}</select></label>
            <label className={labelClass}>학과<select className={fieldClass} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>{departments.map((d) => <option key={d.id} value={d.id}>{d.majorName}</option>)}</select></label>
          </div>
          <div className="mb-6 mt-8 border-b border-[#f0f0f4] pb-4"><h2 className="text-sm font-extrabold">학점 정보</h2><p className="mt-1 text-xs text-[#9294a2]">시간표 추천과 수강 신청 가능 학점 계산에 활용됩니다.</p></div>
          <div className="grid gap-5 sm:grid-cols-3">
            <label className={labelClass}>현재 이수 학점<input className={fieldClass} type="number" min="0" step="0.5" value={completedCredits} onChange={(e) => setCompletedCredits(e.target.value)} required /></label>
            <label className={labelClass}>졸업 필요 학점<input className={fieldClass} type="number" min="1" step="0.5" value={graduationCredits} onChange={(e) => setGraduationCredits(e.target.value)} required /></label>
            <label className={labelClass}>최대 신청 학점<input className={fieldClass} type="number" min="1" max="50" step="0.5" value={maxCredits} onChange={(e) => setMaxCredits(e.target.value)} required /></label>
          </div>
          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-[#f0f0f4] pt-5"><button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-[#e2e3eb] px-5 py-3 text-xs font-bold text-[#6e7080] hover:bg-[#f8f8fb]">취소</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#7560e8] px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#654fd7] disabled:cursor-wait disabled:opacity-60"><Save size={15} />{saving ? "저장 중…" : "변경사항 저장"}</button></div>
        </section>
        <aside className="h-fit rounded-2xl border border-[#e6e7ee] bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-extrabold"><CheckCircle2 size={17} className="text-[#7560e8]" />변경 정보 미리보기</div>
          <div className="mt-5 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#eeeaff] text-lg font-extrabold text-[#7560e8]">{name.trim().slice(0,1) || "학"}</div><div className="min-w-0"><p className="truncate text-sm font-extrabold">{name || "이름"}</p><p className="mt-1 truncate text-xs text-[#8a8c9a]">{selectedDepartment?.majorName ?? "학과"} · {grade}학년</p></div></div>
          <div className="mt-5 space-y-3 border-t border-[#f0f0f4] pt-4 text-xs"><div className="flex justify-between"><span className="text-[#8a8c9a]">이수 학점</span><strong>{completedCredits || 0}학점</strong></div><div className="flex justify-between"><span className="text-[#8a8c9a]">졸업 필요</span><strong>{graduationCredits || 0}학점</strong></div><div className="flex justify-between"><span className="text-[#8a8c9a]">신청 상한</span><strong>{maxCredits || 0}학점</strong></div></div>
          <p className="mt-5 rounded-xl bg-[#f7f6ff] p-3 text-[11px] leading-5 text-[#756aab]">저장하면 연결된 서버에 정보가 반영됩니다. 저장에 실패하면 기존 정보는 유지됩니다.</p>
        </aside>
      </form>
    </main>
  );
}
