import { useState } from "react";
import { Check, Clock3, Sparkles, WandSparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";
import { useCourseStore } from "../store/courseStore";
import { useUserStore } from "../store/userStore";
import type { CourseListItem } from "../../shared/types/database";
import { api } from "../../shared/api";

type Preferences = {
  credits: number;
  majorOnly: boolean;
  online: boolean;
  avoidMorning: boolean;
};

type Recommendation = { courses: CourseListItem[]; reason: string };

export default function AIRecommendationPage({ demoMode = false }: { demoMode?: boolean }) {
  const catalogCourses = useCourseCatalogStore(state => state.courses);
  const sampleCourses: CourseListItem[] = [
    { id: 90001, courseCode: "TEST301", title: "테스트 자료구조", category: "전공", courseType: "전공필수", credit: 3, sectionNo: "01", professorName: "테스트 교수", capacity: 40, targetGrade: 2, departmentId: 1, majorName: "컴퓨터공학과", isOnline: false, schedules: [{ id: 1, dayOfWeek: "월", startPeriod: 3, endPeriod: 4, classroom: "테스트 강의실", openCourseId: 90001 }] },
    { id: 90002, courseCode: "TEST302", title: "테스트 운영체제", category: "전공", courseType: "전공필수", credit: 3, sectionNo: "01", professorName: "테스트 교수", capacity: 40, targetGrade: 3, departmentId: 1, majorName: "컴퓨터공학과", isOnline: false, schedules: [{ id: 2, dayOfWeek: "화", startPeriod: 5, endPeriod: 6, classroom: "테스트 강의실", openCourseId: 90002 }] },
    { id: 90003, courseCode: "TEST303", title: "테스트 데이터베이스", category: "전공", courseType: "전공선택", credit: 3, sectionNo: "01", professorName: "테스트 교수", capacity: 40, targetGrade: 3, departmentId: 1, majorName: "컴퓨터공학과", isOnline: false, schedules: [{ id: 3, dayOfWeek: "수", startPeriod: 3, endPeriod: 4, classroom: "테스트 강의실", openCourseId: 90003 }] },
    { id: 90004, courseCode: "TEST304", title: "테스트 인공지능", category: "전공", courseType: "전공선택", credit: 3, sectionNo: "01", professorName: "테스트 교수", capacity: 40, targetGrade: 3, departmentId: 1, majorName: "컴퓨터공학과", isOnline: false, schedules: [{ id: 4, dayOfWeek: "목", startPeriod: 5, endPeriod: 6, classroom: "테스트 강의실", openCourseId: 90004 }] },
    { id: 90005, courseCode: "TEST305", title: "테스트 소프트웨어공학", category: "전공", courseType: "전공선택", credit: 3, sectionNo: "01", professorName: "테스트 교수", capacity: 40, targetGrade: 3, departmentId: 1, majorName: "컴퓨터공학과", isOnline: false, schedules: [{ id: 5, dayOfWeek: "금", startPeriod: 3, endPeriod: 4, classroom: "테스트 강의실", openCourseId: 90005 }] },
  ];
  const courses = demoMode ? sampleCourses : catalogCourses;
  const user = useUserStore((s) => s.user);
  const selected = useCourseStore((s) => s.selected);
  const setSelected = useCourseStore((s) => s.setSelected);
  const [preferences, setPreferences] = useState<Preferences>({
    credits: Math.min(user?.maxCredits ?? 18, 15),
    majorOnly: false,
    online: false,
    avoidMorning: false,
  });
  const [generated, setGenerated] = useState(false);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const current = recommendations[active]?.courses ?? [];
  const currentReason = recommendations[active]?.reason ?? "";
  const currentCredits = current.reduce((sum, c) => sum + c.credit, 0);

  const generate = async () => {
    if (busy) return;
    if (!courses.length) {
      toast.error("추천할 강좌가 없습니다. 테스트 과목을 불러오거나 DB를 연결하세요.");
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ recommendations: { courseIds: number[]; reason: string }[] }>(
        "/recommendations",
        {
          method: "POST",
          body: JSON.stringify({
            courses,
            preferences: { ...preferences, major: user?.major ?? null },
            selectedCourseIds: selected.map((course) => course.id),
          }),
        },
        "student",
      );
      const byId = new Map(courses.map((course) => [course.id, course]));
      const mapped = result.recommendations.map((item) => ({
        courses: item.courseIds.flatMap((id) => byId.has(id) ? [byId.get(id)!] : []),
        reason: item.reason,
      })).filter((item) => item.courses.length);
      if (!mapped.length) throw new Error("AI가 추천 과목을 반환하지 않았습니다.");
      setRecommendations(mapped);
      setGenerated(true);
      setActive(0);
      toast.success("Gemini AI가 시간표 후보를 만들었습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 추천에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };
  const apply = () => {
    if (demoMode) {
      toast.message("AI 테스트 모드에서는 시간표 저장을 사용할 수 없습니다.");
      return;
    }
    if (!current.length) return;
    if (
      selected.length &&
      !window.confirm("현재 시간표를 이 추천안으로 교체할까요?")
    )
      return;
    if (!setSelected(current)) return;
    toast.success(`${current.length}개 강의를 나의 시간표에 반영했습니다.`);
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
      <div className="grid gap-4 min-[1050px]:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[#e3e4e9] bg-white p-5 shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eee9ff] text-[#7658e9]">
              <Sparkles size={19} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold">AI 시간표 추천{demoMode ? " · TEST" : ""}</h1>
              <p className="mt-1 text-[9px] text-[#9699a7]">
                {demoMode ? "샘플 강좌로 AI 연결을 확인합니다." : "원하는 조건을 설정하면 후보 시간표를 구성합니다."}
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            <label className="block">
              <div className="flex justify-between text-[10px] font-bold">
                <span>목표 학점</span>
                <b className="text-[#7658e9]">{preferences.credits}학점</b>
              </div>
              <input
                type="range"
                min="6"
                max={user?.maxCredits ?? 18}
                step="1"
                value={preferences.credits}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    credits: Number(e.target.value),
                  }))
                }
                className="mt-3 w-full accent-[#7658e9]"
              />
            </label>
            <Toggle
              label="전공 과목 중심"
              checked={preferences.majorOnly}
              onChange={(v) => setPreferences((p) => ({ ...p, majorOnly: v }))}
            />
            <Toggle
              label="온라인 강의 허용"
              checked={preferences.online}
              onChange={(v) => setPreferences((p) => ({ ...p, online: v }))}
            />
            <Toggle
              label="1~2교시 피하기"
              checked={preferences.avoidMorning}
              onChange={(v) =>
                setPreferences((p) => ({ ...p, avoidMorning: v }))
              }
            />
          </div>
          <div className="mt-6 rounded-xl bg-[#fafafd] p-4 text-[9px] leading-5 text-[#777985]">
            <b className="text-[#454652]">현재 반영 기준</b>
            <br />
            학점 한도 · 시간표 충돌 · 수업 방식 · 전공 여부를 기준으로 후보를
            구성합니다.
          </div>
          <button
            onClick={() => void generate()}
            disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7658e9] py-3 text-[10px] font-bold text-white hover:bg-[#6749dc]"
          >
            <WandSparkles size={14} /> {busy ? "Gemini가 추천 중…" : "AI 추천 시간표 만들기"}
          </button>
        </section>

        <section className="min-w-0 rounded-2xl border border-[#e3e4e9] bg-white p-5 shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
          {!generated ? (
            <EmptyAI onGenerate={generate} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf0] pb-4">
                <div>
                  <h2 className="text-sm font-bold">추천 시간표 후보</h2>
                  <p className="mt-1 text-[9px] text-[#9699a7]">
                    총 {currentCredits}학점 · 후보 {recommendations.length}개
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGenerated(false);
                    setActive(0);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#dedfe5] px-3 py-2 text-[9px] text-[#777985]"
                >
                  <RotateCcw size={12} /> 조건 다시 설정
                </button>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`min-w-[150px] rounded-xl border p-3 text-left ${active === i ? "border-[#c9c1ff] bg-[#f7f5ff]" : "border-[#e7e7ec] bg-white"}`}
                  >
                    <span className="text-[8px] font-bold text-[#9699a7]">
                      추천 {i + 1}
                    </span>
                    <b className="mt-1 block text-[11px]">
                      {rec.courses.reduce((s, c) => s + c.credit, 0)}학점 · {rec.courses.length}
                      과목
                    </b>
                    <span className="mt-1 block truncate text-[8px] text-[#8d8f9c]">
                      AI 추천 후보
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {currentReason && <p className="rounded-xl bg-[#f7f5ff] px-4 py-3 text-[10px] leading-5 text-[#6552ae]">{currentReason}</p>}
                {current.length ? (
                  current.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ececf0] px-4 py-3"
                    >
                      <div>
                        <b className="text-[10px]">{course.title}</b>
                        <p className="mt-1 text-[8px] text-[#9699a7]">
                          {course.courseCode} · {course.professorName} ·{" "}
                          {course.credit}학점
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[8px] text-[#777985]">
                        {course.isOnline ? (
                          <span className="rounded-md bg-[#eef8f6] px-2 py-1 text-[#278b73]">
                            온라인
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock3 size={11} />
                            {course.schedules
                              .map(
                                (s) =>
                                  `${s.dayOfWeek}${s.startPeriod}-${s.endPeriod}`,
                              )
                              .join(" / ")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-[10px] text-[#9699a7]">
                    조건을 조금 완화하면 추천할 수 있는 강의가 늘어납니다.
                  </div>
                )}
              </div>
              <div className="mt-5 flex justify-end">
                {!demoMode && <button
                  onClick={apply}
                  disabled={!current.length}
                  className="flex items-center gap-2 rounded-xl bg-[#7658e9] px-5 py-3 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#d8d6e3]"
                >
                  <Check size={14} /> 이 시간표 사용하기
                </button>}
              </div>
            </>
          )}
        </section>
      </div>
      <p className="mt-3 px-1 text-[8px] text-[#aaaab4]">
      ※ 추천은 백엔드에서 Gemini AI로 생성하며, API 키는 서버에만 저장됩니다.
      {demoMode ? " 테스트 강좌만 사용하며 시간표 저장은 비활성화됩니다." : ""}
      </p>
    </main>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between text-left"
    >
      <span className="text-[10px] font-semibold text-[#454652]">{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[#7658e9]" : "bg-[#dedfe6]"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
function EmptyAI({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="grid min-h-[520px] place-items-center text-center">
      <div className="max-w-[400px]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eee9ff] text-[#7658e9]">
          <Sparkles size={28} />
        </div>
        <h2 className="mt-5 text-base font-extrabold">
          내 조건에 맞는 시간표를 찾아보세요
        </h2>
        <p className="mt-2 text-[10px] leading-5 text-[#8c8f9c]">
          목표 학점과 선호 조건을 설정하면 충돌을 피하면서 수강 가능한 후보
          시간표를 만들어줍니다.
        </p>
        <button
          onClick={() => void onGenerate()}
          className="mt-5 rounded-lg border border-[#dcd9ea] px-4 py-2 text-[9px] font-bold text-[#7658e9]"
        >
          추천 시작하기
        </button>
      </div>
    </div>
  );
}
