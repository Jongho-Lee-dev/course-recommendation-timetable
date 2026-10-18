import { useState } from "react";
import { Check, Clock3, LoaderCircle, Sparkles, WandSparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";
import { useCourseStore } from "../store/courseStore";
import { useUserStore } from "../store/userStore";
import { api } from "../../shared/api";
import type { CourseListItem } from "../../shared/types/database";

type Preferences = {
  credits: number;
  majorOnly: boolean;
  online: boolean;
  avoidMorning: boolean;
};

type Recommendation = { courses: CourseListItem[]; reason: string };

export default function AIRecommendationPage() {
  const courses = useCourseCatalogStore(s=>s.courses);
  const user = useUserStore((s) => s.user);
  const selected = useCourseStore((s) => s.selected);
  const setSelected = useCourseStore((s) => s.setSelected);
  const [preferences, setPreferences] = useState<Preferences>({
    credits: Math.min(user?.maxCredits ?? 18, 15),
    majorOnly: false,
    online: false,
    avoidMorning: false,
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [active, setActive] = useState(0);

  const current = recommendations[active];

  const generate = async () => {
    setLoading(true);
    setEmptyMessage("");
    try {
      const result = await api<{ recommendations: { courseIds: number[]; reason: string }[]; message?: string | null }>(
        "/recommendations",
        { method: "POST", body: JSON.stringify(preferences) },
        "student",
      );
      const mapped = result.recommendations.map((recommendation) => ({
        courses: recommendation.courseIds
          .map((id) => courses.find((course) => course.id === id))
          .filter((course): course is CourseListItem => Boolean(course)),
        reason: recommendation.reason,
      })).filter((recommendation) => recommendation.courses.length > 0);
      setRecommendations(mapped);
      setEmptyMessage(result.message ?? "");
      setActive(0);
      setGenerated(true);
      if (mapped.length) toast.success("AI가 조건에 맞는 시간표를 추천했습니다.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 추천을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!current?.courses.length) return;
    if (selected.length && !window.confirm("현재 시간표를 이 추천안으로 교체할까요?")) return;
    setSelected(current.courses);
  };

  const reset = () => {
    setGenerated(false);
    setRecommendations([]);
    setActive(0);
  };

  const startRecommendation = () => {
    void generate();
  };

  const currentCredits = current?.courses.reduce((sum, c) => sum + c.credit, 0) ?? 0;

  const generateFromEmpty = () => {
    startRecommendation();
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
            학생 정보와 개설 강좌를 AI가 분석합니다. 학점 한도와 시간 충돌은 서버에서도 확인합니다.
          </div>
          <button
            onClick={startRecommendation}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7658e9] py-3 text-[10px] font-bold text-white hover:bg-[#6749dc]"
          >
            {loading ? <LoaderCircle size={14} className="animate-spin" /> : <WandSparkles size={14} />}
            {loading ? "AI가 시간표를 구성하고 있어요…" : "AI 추천 시간표 만들기"}
          </button>
        </section>

        <section className="min-w-0 rounded-2xl border border-[#e3e4e9] bg-white p-5 shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
          {!generated ? (
            <EmptyAI onGenerate={generateFromEmpty} loading={loading} />
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
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded-lg border border-[#dedfe5] px-3 py-2 text-[9px] text-[#777985]"
                >
                  <RotateCcw size={12} /> 조건 다시 설정
                </button>
              </div>
              {!recommendations.length ? (
                <div className="py-16 text-center text-[10px] text-[#9699a7]">{emptyMessage || "추천 결과가 없습니다."}</div>
              ) : <>
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
                    <span className="mt-1 block text-[8px] text-[#8d8f9c]">
                      조건 충족 후보
                    </span>
                  </button>
                ))}
              </div>
              {current?.reason && <p className="mt-4 rounded-xl bg-[#f7f5ff] px-4 py-3 text-[9px] leading-5 text-[#6555a7]">{current.reason}</p>}
              <div className="mt-4 space-y-2">
                {current?.courses.length ? (
                  current.courses.map((course) => (
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
                  null
                )}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={apply}
                  disabled={!current?.courses.length}
                  className="flex items-center gap-2 rounded-xl bg-[#7658e9] px-5 py-3 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#d8d6e3]"
                >
                  <Check size={14} /> 이 시간표 사용하기
                </button>
              </div>
              </>}
            </>
          )}
        </section>
      </div>
      <p className="mt-3 px-1 text-[8px] text-[#aaaab4]">
        ※ 추천 결과는 실제 Gemini API를 통해 생성하며, 서버가 정원·시간 충돌·학점 한도를 재검증합니다.
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
function EmptyAI({ onGenerate, loading }: { onGenerate: () => void; loading: boolean }) {
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
          disabled={loading}
          className="mt-5 rounded-lg border border-[#dcd9ea] px-4 py-2 text-[9px] font-bold text-[#7658e9]"
        >
          {loading ? "추천 중…" : "AI 추천 시작하기"}
        </button>
      </div>
    </div>
  );
}
