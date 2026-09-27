import { useMemo, useState } from "react";

type Course = {
  code: string;
  name: string;
  professor: string;
  day: string;
  start: number;
  end: number;
  color: string;
};

const days = ["월", "화", "수", "목", "금"];
const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const courses: Course[] = [
  {
    code: "CS201",
    name: "자료구조",
    professor: "김교수",
    day: "월",
    start: 10,
    end: 12,
    color: "bg-violet-500",
  },
  {
    code: "CS305",
    name: "컴퓨터 네트워크",
    professor: "박교수",
    day: "화",
    start: 13,
    end: 15,
    color: "bg-cyan-500",
  },
  {
    code: "CS210",
    name: "알고리즘 설계",
    professor: "이교수",
    day: "수",
    start: 14,
    end: 16,
    color: "bg-purple-500",
  },
  {
    code: "CS310",
    name: "웹 프로그래밍",
    professor: "최교수",
    day: "목",
    start: 10,
    end: 12,
    color: "bg-blue-500",
  },
  {
    code: "CS401",
    name: "데이터베이스",
    professor: "정교수",
    day: "금",
    start: 13,
    end: 16,
    color: "bg-emerald-500",
  },
];

const recommendations = [
  {
    title: "균형형 시간표",
    credits: 18,
    emptyDays: "월 / 금",
    classDays: "화 / 수 / 목",
    description: "수업을 3일에 집중하고 월요일과 금요일을 공강으로 확보했습니다.",
    score: 96,
  },
  {
    title: "공강 최대화",
    credits: 18,
    emptyDays: "월 / 수",
    classDays: "화 / 목 / 금",
    description: "수업일을 최소화하고 하루의 수업 시간을 효율적으로 배치했습니다.",
    score: 92,
  },
  {
    title: "오전 최소화",
    credits: 17,
    emptyDays: "월 / 금",
    classDays: "화 / 수 / 목",
    description: "오전 수업을 최소화하여 늦은 시간에 시작하는 시간표입니다.",
    score: 89,
  },
];

export default function HomePage() {
  const [selectedRecommendation, setSelectedRecommendation] = useState(0);
  const [desiredCredits, setDesiredCredits] = useState(18);
  const [preferredDays, setPreferredDays] = useState<string[]>(["월", "금"]);
  const [preferredTime, setPreferredTime] = useState("상관없음");
  const [loading, setLoading] = useState(false);

  const currentRecommendation =
    recommendations[selectedRecommendation];

  const toggleDay = (day: string) => {
    setPreferredDays((prev) =>
      prev.includes(day)
        ? prev.filter((item) => item !== day)
        : [...prev, day],
    );
  };

  const generateRecommendation = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSelectedRecommendation(
        (prev) => (prev + 1) % recommendations.length,
      );
    }, 800);
  };

  const timetableCourses = useMemo(() => courses, []);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b0c10]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 font-bold">
              T
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                Timely
              </div>
              <div className="text-[10px] text-gray-500">
                AI COURSE PLANNER
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {["대시보드", "강의 검색", "내 시간표", "AI 추천"].map(
              (menu, index) => (
                <button
                  key={menu}
                  className={`rounded-lg px-4 py-2 text-sm transition ${
                    index === 0
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {menu}
                </button>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">김도현</p>
              <p className="text-xs text-gray-500">
                컴퓨터공학과 · 3학년
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold">
              김
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        {/* Top title */}
        <section className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                2026학년도 2학기
              </span>

              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                수강신청 준비중
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              나에게 맞는 시간표를
              <span className="ml-2 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                AI가 만들어드립니다.
              </span>
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              희망 학점과 공강, 선호 시간 등을 설정하면 최적의
              시간표를 추천해드려요.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
              <p className="text-xs text-gray-500">수강신청까지</p>
              <p className="text-lg font-bold text-white">D-12</p>
            </div>

            <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium transition hover:bg-white/10">
              강의 검색
            </button>
          </div>
        </section>

        {/* Summary Cards */}
        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="현재 신청 학점"
            value="15"
            unit="/ 18학점"
            description="3학점 추가 가능"
            icon="◎"
          />

          <SummaryCard
            label="신청 과목"
            value="5"
            unit="과목"
            description="전공 4 · 교양 1"
            icon="▣"
          />

          <SummaryCard
            label="공강"
            value="2"
            unit="일"
            description="월요일 · 금요일"
            icon="○"
          />

          <SummaryCard
            label="시간표 충돌"
            value="0"
            unit="건"
            description="현재 충돌 없음"
            icon="✓"
            positive
          />
        </section>

        {/* Main Grid */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* Timetable */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111318]">
            <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold">나의 시간표</h2>
                <p className="mt-1 text-xs text-gray-500">
                  현재 선택된 강의 기준 시간표입니다.
                </p>
              </div>

              <div className="flex gap-2">
                <button className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-400 hover:bg-white/5">
                  주간 보기
                </button>
                <button className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-medium text-white hover:bg-violet-400">
                  + 강의 추가
                </button>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <div className="min-w-[700px]">
                {/* Day Header */}
                <div className="grid grid-cols-[55px_repeat(5,1fr)]">
                  <div />

                  {days.map((day) => (
                    <div
                      key={day}
                      className={`border-b border-white/10 py-3 text-center text-sm font-semibold ${
                        preferredDays.includes(day)
                          ? "text-violet-300"
                          : "text-gray-400"
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar */}
                <div className="relative grid grid-cols-[55px_repeat(5,1fr)]">
                  {/* Time labels */}
                  <div>
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-16 border-b border-white/[0.05] pr-3 pt-2 text-right text-[11px] text-gray-600"
                      >
                        {hour}:00
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {days.map((day) => (
                    <div
                      key={day}
                      className="relative border-l border-white/[0.07]"
                    >
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="h-16 border-b border-white/[0.05]"
                        />
                      ))}

                      {timetableCourses
                        .filter((course) => course.day === day)
                        .map((course) => (
                          <CourseBlock
                            key={course.code}
                            course={course}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation */}
          <aside className="flex flex-col gap-6">
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.09] to-[#111318] p-5">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300">
                      ✦
                    </span>

                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                      AI Planner
                    </span>
                  </div>

                  <h2 className="text-xl font-bold">
                    AI 시간표 추천
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    원하는 조건을 입력하면 AI가
                    <br />
                    최적의 시간표를 찾아줍니다.
                  </p>
                </div>
              </div>

              {/* Credits */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">
                    희망 학점
                  </label>

                  <span className="text-sm font-bold text-violet-300">
                    {desiredCredits}학점
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[15, 16, 17, 18].map((credit) => (
                    <button
                      key={credit}
                      onClick={() => setDesiredCredits(credit)}
                      className={`rounded-lg border py-2 text-xs transition ${
                        desiredCredits === credit
                          ? "border-violet-400 bg-violet-500/20 text-violet-200"
                          : "border-white/10 bg-white/[0.03] text-gray-500 hover:bg-white/5"
                      }`}
                    >
                      {credit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Empty Days */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">
                    공강 희망 요일
                  </label>

                  <span className="text-xs text-gray-600">
                    복수 선택
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {days.map((day) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`rounded-lg border py-2 text-xs transition ${
                        preferredDays.includes(day)
                          ? "border-violet-400 bg-violet-500/20 text-violet-200"
                          : "border-white/10 bg-white/[0.03] text-gray-500 hover:bg-white/5"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium">
                  선호 시간대
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {["오전", "오후", "상관없음"].map((time) => (
                    <button
                      key={time}
                      onClick={() => setPreferredTime(time)}
                      className={`rounded-lg border py-2 text-xs transition ${
                        preferredTime === time
                          ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                          : "border-white/10 bg-white/[0.03] text-gray-500 hover:bg-white/5"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="mb-5 space-y-2">
                <p className="mb-2 text-sm font-medium">
                  우선 조건
                </p>

                <CheckOption
                  label="공강 최대화"
                  checked
                />

                <CheckOption
                  label="수업일 최소화"
                  checked
                />

                <CheckOption
                  label="오전 수업 최소화"
                />

                <CheckOption
                  label="선호 강의 우선"
                />
              </div>

              <button
                onClick={generateRecommendation}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 py-3.5 text-sm font-semibold shadow-lg shadow-violet-500/20 transition hover:from-violet-400 hover:to-purple-400 disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    AI가 분석 중...
                  </>
                ) : (
                  <>✦ AI 시간표 생성하기</>
                )}
              </button>
            </div>
          </aside>
        </section>

        {/* Recommendation Results */}
        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-lg">✦</span>
                <h2 className="text-lg font-bold">
                  AI 추천 시간표
                </h2>
              </div>

              <p className="text-xs text-gray-500">
                입력한 조건을 기준으로 추천된 시간표입니다.
              </p>
            </div>

            <button className="text-xs text-gray-500 hover:text-white">
              전체 보기 →
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {recommendations.map((recommendation, index) => (
              <button
                key={recommendation.title}
                onClick={() => setSelectedRecommendation(index)}
                className={`group rounded-2xl border p-5 text-left transition ${
                  selectedRecommendation === index
                    ? "border-violet-500/50 bg-violet-500/[0.07]"
                    : "border-white/10 bg-[#111318] hover:border-white/20"
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
                      RECOMMENDATION {index + 1}
                    </span>

                    <h3 className="mt-1 font-semibold">
                      {recommendation.title}
                    </h3>
                  </div>

                  <div
                    className={`rounded-lg px-2 py-1 text-xs font-bold ${
                      selectedRecommendation === index
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {recommendation.score}%
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  <InfoBox
                    label="총 학점"
                    value={`${recommendation.credits}학점`}
                  />

                  <InfoBox
                    label="공강"
                    value={recommendation.emptyDays}
                  />

                  <InfoBox
                    label="수업일"
                    value={recommendation.classDays}
                  />

                  <InfoBox
                    label="충돌"
                    value="없음"
                  />
                </div>

                <p className="text-xs leading-5 text-gray-500">
                  {recommendation.description}
                </p>

                <div
                  className={`mt-4 text-xs font-medium transition ${
                    selectedRecommendation === index
                      ? "text-violet-300"
                      : "text-gray-600 group-hover:text-gray-300"
                  }`}
                >
                  이 시간표 선택하기 →
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Selected Recommendation */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-[#111318] p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                  AI RECOMMENDED
                </span>

                <span className="text-xs text-gray-600">
                  추천 적합도 {currentRecommendation.score}%
                </span>
              </div>

              <h2 className="text-lg font-bold">
                {currentRecommendation.title}
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                {currentRecommendation.description}
              </p>
            </div>

            <div className="flex gap-2">
              <button className="rounded-xl border border-white/10 px-5 py-3 text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white">
                상세 비교
              </button>

              <button className="rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black hover:bg-gray-200">
                이 시간표 적용
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* -------------------------------- */
/* Components                       */
/* -------------------------------- */

function SummaryCard({
  label,
  value,
  unit,
  description,
  icon,
  positive = false,
}: {
  label: string;
  value: string;
  unit: string;
  description: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111318] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>

        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${
            positive
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-white/5 text-gray-400"
          }`}
        >
          {icon}
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>

      <p
        className={`mt-1 text-[11px] ${
          positive ? "text-emerald-400" : "text-gray-600"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function CheckOption({
  label,
  checked = false,
}: {
  label: string;
  checked?: boolean;
}) {
  const [active, setActive] = useState(checked);

  return (
    <button
      onClick={() => setActive(!active)}
      className="flex w-full items-center gap-3 rounded-lg py-1 text-left"
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border text-[9px] ${
          active
            ? "border-violet-400 bg-violet-500 text-white"
            : "border-white/20 bg-white/[0.03] text-transparent"
        }`}
      >
        ✓
      </span>

      <span
        className={`text-xs ${
          active ? "text-gray-300" : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] text-gray-600">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-gray-300">
        {value}
      </p>
    </div>
  );
}

function CourseBlock({ course }: { course: Course }) {
  const top = (course.start - 9) * 64;
  const height = (course.end - course.start) * 64;

  return (
    <div
      className={`absolute left-1 right-1 overflow-hidden rounded-lg ${course.color} bg-opacity-20 p-2 ring-1 ring-inset ring-white/10`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
    >
      <div className="text-[10px] font-bold text-white">
        {course.code}
      </div>

      <div className="mt-0.5 truncate text-xs font-semibold text-white">
        {course.name}
      </div>

      <div className="mt-1 truncate text-[10px] text-white/60">
        {course.professor}
      </div>
    </div>
  );
}