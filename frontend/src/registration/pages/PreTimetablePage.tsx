import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import WeeklyTimetable from "../components/WeeklyTimetable";
import { useCourseStore } from "../store/courseStore";

export default function PreTimetablePage() {
  const preSelected = useCourseStore((s) => s.preSelected);
  const removePreSelected = useCourseStore((s) => s.removePreSelected);
  const credits = preSelected.reduce((sum, course) => sum + course.credit, 0);
  return <main className="mx-auto w-full max-w-[1500px] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-sm font-extrabold">예비시간표</h1><p className="mt-1 text-[9px] text-[#9699a7]">미리 담아둔 강좌를 확인하고 시간표를 구성할 수 있습니다.</p></div><Link to="/courses" className="rounded-lg bg-[#7658e9] px-4 py-2.5 text-[9px] font-bold text-white">강의 검색</Link></header>
    <div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#e3e4e9] bg-white p-4"><span className="text-[9px] text-[#9699a7]">예비 담은 강좌</span><b className="mt-2 block text-sm">{preSelected.length}개</b></div><div className="rounded-xl border border-[#e3e4e9] bg-white p-4"><span className="text-[9px] text-[#9699a7]">예비 학점</span><b className="mt-2 block text-sm">{credits}학점</b></div><div className="rounded-xl border border-[#e3e4e9] bg-white p-4"><span className="text-[9px] text-[#9699a7]">안내</span><b className="mt-2 block text-[10px]">본 시간표와 별도 관리</b></div></div>
    <div className="grid gap-4 min-[1101px]:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]"><WeeklyTimetable selected={preSelected}/><section className="rounded-xl border border-[#e3e4e9] bg-white"><div className="border-b border-[#ececf0] px-5 py-4"><h2 className="text-xs font-bold">예비수강신청 목록</h2></div>{preSelected.length ? preSelected.map((course) => <div key={course.id} className="flex items-start justify-between gap-3 border-b border-[#f0f0f3] px-5 py-4"><div><b className="text-[10px]">{course.title}</b><p className="mt-1 text-[8px] text-[#9699a7]">{course.courseCode} · {course.professorName} · {course.credit}학점</p><p className="mt-2 text-[8px] text-[#777985]">{course.isOnline ? "온라인 강의" : course.schedules.map((s) => `${s.dayOfWeek} ${s.startPeriod}~${s.endPeriod}교시`).join(" / ")}</p></div><button aria-label={`${course.title} 예비 목록에서 삭제`} onClick={() => removePreSelected(course.id)} className="rounded-md p-2 text-[#a0a3ae] hover:bg-red-50 hover:text-red-600"><Trash2 size={13}/></button></div>) : <p className="px-5 py-12 text-center text-[10px] text-[#9699a7]">아직 담아둔 강좌가 없습니다.</p>}</section></div>
  </main>;
}
