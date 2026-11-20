import { useEffect, useMemo, useState } from "react";
import { ClipboardList, CheckCircle2, Search, Trash2 } from "lucide-react";
import { useCourseStore } from "../store/courseStore";
import { useEnrollmentStore } from "../store/enrollmentStore";

export default function HistoryPage() {
  const selected = useCourseStore((s) => s.selected);
  const { enrolled: history, loading, busy, loaded, error, load, change } = useEnrollmentStore();
  useEffect(() => { void load(); }, [load]);
  const [keyword, setKeyword] = useState("");
  const [tab, setTab] = useState("전체");
  const pending = selected.filter(course => !history.some(item => item.id === course.id));
  const addAll = () => void change(pending.map(course => course.id), "add");
  const filtered = useMemo(
    () =>
      history.filter(
        (c) =>
          (tab === "전체" || tab === "신청완료") &&
          (!keyword.trim() ||
            `${c.title} ${c.courseCode} ${c.professorName}`
              .toLowerCase()
              .includes(keyword.toLowerCase())),
      ),
    [history, keyword, tab],
  );
  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="신청 완료" value={loaded ? `${history.length}과목` : "—"} />
        <Metric
          label="신청 학점"
          value={loaded ? `${history.reduce((s, c) => s + c.credit, 0)}학점` : "—"}
        />
        <Metric label="현재 시간표" value={`${selected.length}과목`} />
      </div>
      <section className="overflow-hidden rounded-2xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
        <header className="border-b border-[#ececf0] px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef8f6] text-[#348f79]">
                <ClipboardList size={18} />
              </div>
              <div>
                <h1 className="text-sm font-extrabold">수강신청 내역</h1>
                <p className="mt-1 text-[9px] text-[#9699a7]">
                  현재 학기의 수강신청 기록을 확인하고 관리합니다.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addAll}
                disabled={busy || loading || !loaded || !pending.length}
                className="rounded-lg bg-[#7658e9] px-3 py-2 text-[9px] font-bold text-white"
              >
                {busy ? "처리 중…" : "현재 시간표 수강신청"}
              </button>
              <button
                disabled={busy || loading || !loaded || !history.length}
                aria-label="전체 수강신청 취소"
                onClick={() => {
                  if (
                    history.length &&
                    window.confirm("신청한 모든 강좌를 취소할까요?")
                  )
                    void change(history.map(course => course.id), "cancel");
                }}
                className="rounded-lg border border-[#dedfe5] p-2 text-[#777985]"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b0]"
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="강좌명, 학수번호, 교수명 검색"
                className="w-full rounded-lg border border-[#dddfe6] py-2.5 pl-9 pr-3 text-[9px] outline-none focus:border-[#a99aed]"
              />
            </div>
            <button onClick={() => void load()} disabled={busy || loading} className="rounded-lg border px-3 py-2 text-[9px]">새로고침</button>
            {["전체", "신청완료"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg border px-3 py-2.5 text-[9px] font-semibold ${tab === t ? "border-[#7658e9] bg-[#7658e9] text-white" : "border-[#dedfe5] bg-white text-[#777985]"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>
        {error && <p role="alert" className="px-5 py-3 text-xs text-red-600">{error} 위의 새로고침으로 다시 조회하세요.</p>}
        {loading && <p role="status" className="px-5 py-3 text-xs">신청내역을 불러오는 중입니다…</p>}
        {!loaded ? null : filtered.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-[#9699a7]">
            {history.length
              ? "검색 결과가 없습니다."
              : "신청한 강좌가 없습니다. 시간표에 과목을 담은 뒤 수강신청하세요."}
          </div>
        ) : (
          <div>
            {filtered.map((course) => (
              <div
                key={course.id}
                className="flex flex-wrap items-center gap-4 border-b border-[#f0f0f3] px-5 py-4"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#f4f4f7] text-[#777985]">
                  <CheckCircle2 size={15} />
                </div>
                <div className="min-w-[220px] flex-1">
                  <div className="flex items-center gap-2">
                    <b className="text-[10px]">{course.title}</b>
                    <span className="rounded-md bg-[#eef8f6] px-2 py-1 text-[7px] font-bold text-[#348f79]">
                      신청완료
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] text-[#9699a7]">
                    {course.courseCode} · {course.professorName} ·{" "}
                    {course.credit}학점 · 2026-2학기
                  </p>
                </div>
                <span className="text-[8px] text-[#9699a7]">
                  {course.isOnline
                    ? "온라인"
                    : course.schedules
                        .map(
                          (s) =>
                            `${s.dayOfWeek} ${s.startPeriod}-${s.endPeriod}`,
                        )
                        .join(" / ")}
                </span>
                <button
                  disabled={busy || loading}
                  aria-label={`${course.title} 수강신청 취소`}
                  onClick={() => {
                    if (window.confirm(`'${course.title}' 수강신청을 취소할까요?`))
                      void change([course.id], "cancel");
                  }}
                  className="rounded-lg border border-[#dedfe5] p-2 text-[#9a9daa] hover:text-[#df6471]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="border-t border-[#f0f0f3] px-5 py-3 text-[8px] text-[#a0a3ae]">
          서버에 저장된 신청 완료 강좌입니다. 취소한 강좌는 목록에서 제외됩니다.
        </div>
      </section>
    </main>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e3e4e9] bg-white px-5 py-4 shadow-[0_3px_14px_rgba(26,28,44,0.025)]">
      <p className="text-[8px] text-[#9699a7]">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-[#30313b]">{value}</p>
    </div>
  );
}
