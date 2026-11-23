import type { CourseListItem } from "../../shared/types/database";
import { Link } from "react-router-dom";
import { useEnrollmentStore } from "../store/enrollmentStore";
import { useRegistrationStatus } from "../../shared/hooks/useRegistrationStatus";

type CourseRegistrationListProps = {
  selected: CourseListItem[];
  totalCredits: number;
};

export default function CourseRegistrationList({
  selected,
  totalCredits,
}: CourseRegistrationListProps) {
  const { enrolled, busy, loading, loaded, error, change, load } = useEnrollmentStore();
  const { canEnroll, closedMessage } = useRegistrationStatus();
  const pending = selected.filter(course => !enrolled.some(item => item.id === course.id));
  return (
    <div className="overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
      <div className="flex items-center justify-between border-b border-[#ececf0] px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold">수강 신청 목록</h2>

          <p className="mt-1 text-[9px] text-[#9699a7]">
            시간표에 담은 강좌입니다. 수강신청 버튼을 눌러 신청을 완료하세요.
          </p>
        </div>

        <strong className="text-[9px] text-[#7658e9]">
          선택 총 학점: {totalCredits}학점
        </strong>
      </div>

      <div className="grid grid-cols-1 gap-1.5 px-5 py-2 min-[701px]:grid-cols-2">
        {selected.map((course) => (
          <div
            className="relative rounded-md border border-[#ececf1] px-2.5 py-2"
            key={course.id}
          >
            <span className="block text-[10px] font-bold">{course.title}</span>

            <small className="mt-0.5 block text-[8px] text-[#9699a7]">
              {course.courseCode} · {course.professorName}
            </small>

            <b className="absolute right-2 top-2.5 text-[8px] text-[#7658e9]">
              {course.credit}학점
            </b>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-[#ececf0] px-5 py-3 text-xs">
        <button disabled={busy || loading || !loaded || !pending.length || !canEnroll}
          className="rounded-lg bg-[#7658e9] px-4 py-2 font-bold text-white disabled:opacity-40"
          onClick={() => void change(pending.map(course => course.id), "add")}>
          {busy ? "처리 중…" : `수강신청 (${pending.length}과목)`}
        </button>
        <Link to="/history" className="text-[#7658e9]">신청내역 · 취소</Link>
        {closedMessage && <span role="status" className="text-[#777985]">{closedMessage}</span>}
        {loading && <span role="status">신청내역 확인 중…</span>}
        {error && <span role="alert">{error} <button onClick={() => void load()} disabled={busy || loading}>다시 조회</button></span>}
      </div>
    </div>
  );
}
