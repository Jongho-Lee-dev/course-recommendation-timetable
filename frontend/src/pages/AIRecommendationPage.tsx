import { useMemo, useState } from "react";
import { Check, Clock3, Sparkles, WandSparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { mockCourses } from "../data/mockCourses";
import { useCourseStore } from "../store/courseStore";
import { useUserStore } from "../store/userStore";
import type { CourseListItem } from "../types/database";

type Preferences = {
  credits: number;
  majorOnly: boolean;
  online: boolean;
  avoidMorning: boolean;
};

function hasConflict(a: CourseListItem, b: CourseListItem) {
  if (a.isOnline || b.isOnline) return false;
  return a.schedules.some((x) =>
    b.schedules.some(
      (y) =>
        x.dayOfWeek === y.dayOfWeek &&
        x.startPeriod <= y.endPeriod &&
        x.endPeriod >= y.startPeriod,
    ),
  );
}

function buildRecommendation(
  preferences: Preferences,
  courses: CourseListItem[],
  seed: number,
) {
  const pool = [...courses]
    .filter(
      (c) =>
        (!preferences.majorOnly || c.category === "전공") &&
        (preferences.online || !c.isOnline),
    )
    .sort(
      (a, b) =>
        b.credit - a.credit || ((a.id + seed) % 3) - ((b.id + seed) % 3),
    );
  const result: CourseListItem[] = [];
  let credits = 0;
  for (const course of pool) {
    if (credits + course.credit > preferences.credits) continue;
    if (
      preferences.avoidMorning &&
      course.schedules.some((s) => s.startPeriod <= 2)
    )
      continue;
    if (result.some((selected) => hasConflict(selected, course))) continue;
    result.push(course);
    credits += course.credit;
    if (credits >= preferences.credits - 2) break;
  }
  return result;
}

export default function AIRecommendationPage() {
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

  const recommendations = useMemo(
    () =>
      [0, 1, 2].map((seed) =>
        buildRecommendation(preferences, mockCourses, seed),
      ),
    [preferences],
  );
  const current = recommendations[active];
  const currentCredits = current.reduce((sum, c) => sum + c.credit, 0);

  const generate = () => {
    setGenerated(true);
    setActive(0);
    toast.success("현재 조건에 맞는 시간표 후보를 만들었습니다.");
  };
  const apply = () => {
    if (!current.length) return;
    if (
      selected.length &&
      !window.confirm("현재 시간표를 이 추천안으로 교체할까요?")
    )
      return;
    setSelected(current);
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
              <h1 className="text-sm font-extrabold">AI 시간표 추천</h1>
              <p className="mt-1 text-[9px] text-[#9699a7]">
                원하는 조건을 설정하면 후보 시간표를 구성합니다.
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
            onClick={generate}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7658e9] py-3 text-[10px] font-bold text-white hover:bg-[#6749dc]"
          >
            <WandSparkles size={14} /> 추천 시간표 만들기
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
                      {rec.reduce((s, c) => s + c.credit, 0)}학점 · {rec.length}
                      과목
                    </b>
                    <span className="mt-1 block text-[8px] text-[#8d8f9c]">
                      조건 충족 후보
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
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
                <button
                  onClick={apply}
                  disabled={!current.length}
                  className="flex items-center gap-2 rounded-xl bg-[#7658e9] px-5 py-3 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#d8d6e3]"
                >
                  <Check size={14} /> 이 시간표 사용하기
                </button>
              </div>
            </>
          )}
        </section>
      </div>
      <p className="mt-3 px-1 text-[8px] text-[#aaaab4]">
        ※ 현재는 백엔드 AI API 연결 전 단계의 추천 시뮬레이션입니다. 실제
        서비스에서는 학생 조건과 개설 강좌 데이터를 API로 전달합니다.
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
          onClick={onGenerate}
          className="mt-5 rounded-lg border border-[#dcd9ea] px-4 py-2 text-[9px] font-bold text-[#7658e9]"
        >
          추천 시작하기
        </button>
      </div>
    </div>
  );
}
