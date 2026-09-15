import { useState } from "react";
import type { CourseListItem } from "../types/database";
import { mockCourses } from "../data/mockCourses";
import CourseFilters from "../components/CourseFilters";
import CourseTable from "../components/CourseTable";

const days = ["월", "화", "수", "목", "금"];
const periods = Array.from({ length: 10 }, (_, i) => i + 1);

type FilterCategory = "all" | "major" | "general";

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [professorKeyword, setProfessorKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [selected, setSelected] = useState<CourseListItem[]>(mockCourses.slice(0, 2));
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("현재 시간표를 분석해 최적의 조합을 추천해드릴게요.");
  const [selectedDay, setSelectedDay] = useState("전체 요일");
  const [selectedGrade, setSelectedGrade] = useState("전체 학년");
  const [selectedCollege, setSelectedCollege] = useState("전체 학부");
  const [selectedMajor, setSelectedMajor] = useState("전체 전공");
  const [selectedGeneralEducation, setSelectedGeneralEducation] = useState("전체 교양");
  const [selectedGeneralEducationArea, setSelectedGeneralEducationArea] = useState("전체 영역");
  const [selectedGeneralEducationElectiveArea, setSelectedGeneralEducationElectiveArea] = useState("전체 영역");

  const totalCredits = selected.reduce((sum, item) => sum + item.credit, 0);

  const activeDaysCount = new Set(
    selected.flatMap((course) =>
      course.schedules.map((schedule) => schedule.dayOfWeek),
    ),
  ).size;

  const filteredCourses = mockCourses.filter((course) => {
    const matchesKeyword =
      !keyword.trim() ||
      `${course.title} ${course.courseCode}`.toLowerCase().includes(keyword.toLowerCase());

    const matchesProfessor =
      !professorKeyword.trim() ||
      course.professorName.toLowerCase().includes(professorKeyword.toLowerCase());

    const matchesDay =
      selectedDay === "전체 요일" ||
      course.schedules.some((schedule) => schedule.dayOfWeek === selectedDay);

    const matchesGrade =
      selectedGrade === "전체 학년" ||
      course.targetGrade === Number(selectedGrade.replace("학년", ""));

    if (!matchesKeyword || !matchesProfessor || !matchesDay || !matchesGrade) {
      return false;
    }

    if (filterCategory === "major" && course.category !== "전공") {
      return false;
    }

    if (
      filterCategory === "general" &&
      !["교양 필수", "교양 필수 선택", "교양 선택"].includes(course.category)
    ) {
      return false;
    }

    if (selectedCollege !== "전체 학부" && course.collegeName !== selectedCollege) {
      return false;
    }

    if (selectedMajor !== "전체 전공" && course.majorName !== selectedMajor) {
      return false;
    }

    if (
      selectedGeneralEducation !== "전체 교양" &&
      course.category !== selectedGeneralEducation
    ) {
      return false;
    }

    if (
      selectedGeneralEducationArea !== "전체 영역" &&
      course.generalEducationArea !== selectedGeneralEducationArea
    ) {
      return false;
    }

    if (
      selectedGeneralEducationElectiveArea !== "전체 영역" &&
      course.generalEducationElectiveArea !== selectedGeneralEducationElectiveArea
    ) {
      return false;
    }

    return true;
  });

  const handleResetFilters = () => {
    setKeyword("");
    setProfessorKeyword("");
    setFilterCategory("all");
    setSelectedDay("전체 요일");
    setSelectedGrade("전체 학년");
    setSelectedCollege("전체 학부");
    setSelectedMajor("전체 전공");
    setSelectedGeneralEducation("전체 교양");
    setSelectedGeneralEducationArea("전체 영역");
    setSelectedGeneralEducationElectiveArea("전체 영역");
  };

  const toggleCourse = (course: CourseListItem) => {
    const exists = selected.some((item) => item.id === course.id);

    if (exists) {
      setSelected((prev) => prev.filter((item) => item.id !== course.id));
      return;
    }

    if (selected.length >= 6 || totalCredits + course.credit > 18) {
      return;
    }

    setSelected((prev) => [...prev, course]);
  };

  const generateAi = () => {
    setAiLoading(true);

    setTimeout(() => {
      setAiLoading(false);
      setAiMessage("현재 선택 과목 기준으로 공강과 수업일을 고려한 시간표를 찾았습니다.");
    }, 700);
  };

  return (
    <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 bg-[#f5f6f9] font-['Pretendard',sans-serif] text-[#20212b] min-[701px]:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="flex min-h-auto flex-col bg-[#20212a] px-3.5 py-6 text-[#d7d8df] min-[701px]:min-h-[calc(100vh-72px)]">
        <div className="px-3 text-lg font-extrabold text-white">
          수강신청
        </div>

        <div className="px-3 pb-6 pt-1 text-[10px] text-[#858796]">
          2026학년도 2학기
        </div>

        <nav className="hidden flex-col gap-1 min-[701px]:flex">
          {[
            ["▦", "대시보드"],
            ["⌕", "강의 검색"],
            ["▣", "나의 시간표"],
            ["✦", "AI 시간표 추천"],
            ["♡", "관심 강좌"],
            ["✓", "신청 내역"],
            ["i", "공지사항"],
          ].map(([icon, label], index) => (
            <button
              key={label}
              className={`rounded-lg px-3 py-3 text-left text-[11px] transition ${index === 0
                ? "bg-[#30313d] text-white shadow-[inset_3px_0_#7658e9]"
                : "text-[#9698a4] hover:bg-[#30313d] hover:text-white"
                }`}
            >
              <span className="mr-2 inline-block w-5 text-[#7d7f8c]">
                {icon}
              </span>
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto hidden items-center gap-2 border-t border-[#373843] px-2 pt-4 min-[701px]:flex">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#ece9ff] text-xs font-extrabold text-[#7658e9]">
            김
          </div>

          <div>
            <strong className="block text-[11px] text-white">
              김도현
            </strong>
            <small className="mt-1 block text-[9px] text-[#858796]">
              컴퓨터공학과 · 3학년
            </small>
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-[1500px] min-w-0 px-4 py-6 min-[1101px]:px-7">
        <section className="mb-5 flex flex-col items-start justify-between gap-3 min-[701px]:flex-row min-[701px]:items-end">
          <div>
            <div className="mb-1 text-[11px] text-[#8a8d9b]">
              2026학년도 2학기 수강 신청
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              수강 신청
            </h1>
          </div>

          <div className="grid w-full grid-cols-3 gap-2 min-[701px]:w-auto">
            <div className="min-w-0 rounded-lg border border-[#e4e5eb] bg-white px-3 py-2.5">
              <span className="block text-[9px] text-[#9699a6]">
                수강 신청 현황
              </span>
              <strong className="mt-1 block text-xs">
                진행 중
              </strong>
            </div>

            <div className="min-w-0 rounded-lg border border-[#e4e5eb] bg-white px-3 py-2.5">
              <span className="block text-[9px] text-[#9699a6]">
                남은 시간
              </span>
              <strong className="mt-1 block text-xs">
                01:25:34
              </strong>
            </div>

            <div className="min-w-0 rounded-lg border border-[#e4e5eb] bg-white px-3 py-2.5">
              <span className="block text-[9px] text-[#9699a6]">
                신청 학점
              </span>
              <strong className="mt-1 block text-xs">
                {totalCredits}/18
              </strong>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-4 min-[1101px]:grid-cols-[minmax(0,1.35fr)_minmax(440px,1fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
            <div className="border-b border-[#ececf0] px-5 py-4">
              <h2 className="text-sm font-bold">
                강의 검색
              </h2>

              <p className="mt-1 text-[9px] text-[#9699a7]">
                원하는 조건으로 강좌를 검색하세요.
              </p>
            </div>

            <CourseFilters
              keyword={keyword}
              setKeyword={setKeyword}
              professorKeyword={professorKeyword}
              setProfessorKeyword={setProfessorKeyword}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              selectedGrade={selectedGrade}
              setSelectedGrade={setSelectedGrade}
              selectedCollege={selectedCollege}
              setSelectedCollege={setSelectedCollege}
              selectedMajor={selectedMajor}
              setSelectedMajor={setSelectedMajor}
              selectedGeneralEducation={selectedGeneralEducation}
              setSelectedGeneralEducation={setSelectedGeneralEducation}
              selectedGeneralEducationArea={selectedGeneralEducationArea}
              setSelectedGeneralEducationArea={setSelectedGeneralEducationArea}
              selectedGeneralEducationElectiveArea={
                selectedGeneralEducationElectiveArea
              }
              setSelectedGeneralEducationElectiveArea={
                setSelectedGeneralEducationElectiveArea
              }
              onReset={handleResetFilters}
            />

            <CourseTable
              courses={filteredCourses}
              selected={selected}
              toggleCourse={toggleCourse}
            />
          </section>

          {/* 주간 시간표 */}
          <section className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)] min-[1101px]:order-none">
            <div className="flex items-center justify-between border-b border-[#ececf0] px-5 py-4">
              <div>
                <h2 className="text-sm font-bold">
                  주간 시간표
                </h2>

                <p className="mt-1 text-[9px] text-[#9699a7]">
                  현재 신청한 강좌를 기준으로 표시됩니다.
                </p>
              </div>

              <button className="rounded-md border border-[#dedfe5] bg-white px-2 py-1.5 text-[9px] text-[#777a89]">
                주간 새로고침
              </button>
            </div>

            <div className="flex h-[508px] min-w-[540px]">
              <div className="w-[49px] shrink-0 text-right text-[8px] text-[#a0a3b0]">
                <div className="h-[37px] border-b border-[#e8e9ee]" />

                {periods.map((period) => (
                  <div
                    className="box-border h-[47px] border-b border-[#f1f1f4] pr-1.5 pt-1.5"
                    key={period}
                  >
                    {period}교시
                  </div>
                ))}
              </div>

              <div className="min-w-0 flex-1">
                <div className="grid h-[37px] grid-cols-5 border-b border-[#e8e9ee]">
                  {days.map((day) => (
                    <div
                      className="grid place-items-center border-l border-[#ececf0] text-[9px] font-bold text-[#777a89]"
                      key={day}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid h-[470px] grid-cols-5">
                  {days.map((day) => (
                    <div
                      className="relative border-l border-[#ececf0] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_46px,#eff0f3_46px,#eff0f3_47px)]"
                      key={day}
                    >
                      {periods.map((period) => (
                        <div className="h-[47px]" key={period} />
                      ))}

                      {selected.flatMap((course) =>
                        course.schedules
                          .filter((schedule) => schedule.dayOfWeek === day)
                          .map((schedule) => (
                            <div
                              className="absolute left-[3px] right-[3px] overflow-hidden rounded-md border-l-[3px] border-[#7658e9] bg-[#eee9ff] p-1.5"
                              key={`${course.id}-${schedule.id}`}
                              style={{
                                top: `${(schedule.startPeriod - 1) * 48 + 1}px`,
                                height: `${(schedule.endPeriod - schedule.startPeriod + 1) * 48 - 2}px`,
                              }}
                            >
                              <b className="block text-[7px] text-[#7658e9]">
                                {course.courseCode}
                              </b>

                              <strong className="mt-0.5 block text-[9px]">
                                {course.title}
                              </strong>

                              <small className="mt-1 block text-[7px] text-[#858895]">
                                {course.professorName}
                              </small>
                            </div>
                          )),
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-4 grid gap-4 min-[1101px]:grid-cols-[1.25fr_0.75fr]">
          <div className="overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
            <div className="flex items-center justify-between border-b border-[#ececf0] px-5 py-3.5">
              <div>
                <h2 className="text-sm font-bold">
                  수강 신청 목록
                </h2>
                <p className="mt-1 text-[9px] text-[#9699a7]">
                  현재 선택한 강좌입니다.
                </p>
              </div>

              <strong className="text-[9px] text-[#7658e9]">
                신청 총 학점: {totalCredits}학점
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
          </div>

          <div className="rounded-xl border border-[#282633] bg-[#282633] p-[18px] text-white">
            <div className="text-[8px] font-extrabold tracking-[0.8px] text-[#aa9cf3]">
              ✦ AI COURSE PLANNER
            </div>

            <h2 className="mt-2 text-sm font-bold">
              AI가 시간표를 분석하고 있습니다.
            </h2>

            <p className="mt-1 text-[9px] leading-relaxed text-[#b5b3c0]">
              {aiMessage}
            </p>

            <div className="my-3 grid grid-cols-3 gap-1.5">
              <div className="rounded-md border border-[#3d3b49] bg-[#33313f] p-2">
                <span className="block text-[7px] text-[#9e9ca9]">
                  현재 공강
                </span>
                <b className="mt-1 block text-[10px]">{5 - activeDaysCount}
                  일
                </b>
              </div>

              <div className="rounded-md border border-[#3d3b49] bg-[#33313f] p-2">
                <span className="block text-[7px] text-[#9e9ca9]">
                  수업일
                </span>
                <b className="mt-1 block text-[10px]">
                  {activeDaysCount}일
                </b>
              </div>

              <div className="rounded-md border border-[#3d3b49] bg-[#33313f] p-2">
                <span className="block text-[7px] text-[#9e9ca9]">
                  충돌
                </span>
                <b className="mt-1 block text-[10px] text-[#61d0a4]">
                  0건
                </b>
              </div>
            </div>

            <button
              className="w-full rounded-md bg-white px-3 py-2 text-[10px] font-bold text-[#272532] disabled:cursor-wait disabled:opacity-60"
              onClick={generateAi}
              disabled={aiLoading}
            >
              {aiLoading ? "AI가 분석 중..." : "✦ 최적 시간표 추천받기"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}