import { useMemo, useState } from "react";
import type {
  CourseFilterOption,
  CourseListItem,
} from "../types/database";
import { mockCourses } from "../data/mockCourses";
import {
  createCourseFilters,
  matchesCourseFilter,
} from "../data/CourseFilters";
import WeeklyTimetable from "../components/course/WeeklyTimetable";
import CourseRegistrationList from "../components/course/CourseRegistrationList";
import CourseSearch from "../components/course/CourseSearch";
import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("대시보드");

  const [keyword, setKeyword] = useState("");
  const [professorKeyword, setProfessorKeyword] = useState("");

  const [selectedFilters, setSelectedFilters] = useState<
    Record<number, number[]>
  >({});

  const [selected, setSelected] = useState<CourseListItem[]>(
    mockCourses.slice(0, 2),
  );

  const [aiLoading, setAiLoading] = useState(false);

  const [aiMessage, setAiMessage] = useState(
    "현재 시간표를 분석해 최적의 조합을 추천해드릴게요.",
  );

  // 관리자 필터 설정 목업 사용
  const courseFilters = useMemo(
    () => createCourseFilters(),
    [],
  );

  const totalCredits = selected.reduce(
    (sum, item) => sum + item.credit,
    0,
  );

  const user = useUserStore((state) => state.user);
  const resetUser = useUserStore((state) => state.reset);

  const activeDaysCount = new Set(
    selected.flatMap((course) =>
      course.schedules.map(
        (schedule) => schedule.dayOfWeek,
      ),
    ),
  ).size;

  const filteredCourses = mockCourses.filter((course) => {
    const matchesKeyword =
      !keyword.trim() ||
      `${course.title} ${course.courseCode}`
        .toLowerCase()
        .includes(keyword.toLowerCase());

    const matchesProfessor =
      !professorKeyword.trim() ||
      course.professorName
        .toLowerCase()
        .includes(professorKeyword.toLowerCase());

    if (!matchesKeyword || !matchesProfessor) {
      return false;
    }


    return Object.entries(selectedFilters).every(
      ([filterId, selectedPath]) => {
        if (selectedPath.length === 0) {
          return true;
        }

        const filter = courseFilters.find(
          (item) => item.id === Number(filterId),
        );

        if (!filter) {
          return true;
        }

        // Apply a configured root condition (for example, category=전공).
        if (!matchesCourseFilter(course, filter)) {
          return false;
        }

        if (!filter.isFixed && selectedPath[0] === 0) {
          return true;
        }

        let options = filter.options;
        const selectedOptions: CourseFilterOption[] = [];

        for (const selectedId of selectedPath) {
          // "전체" at a nested level keeps the filters selected above it.
          if (selectedId === 0) {
            break;
          }

          const option = options.find(
            (item) => item.id === selectedId,
          );

          if (!option) {
            return false;
          }

          selectedOptions.push(option);
          options = option.children ?? [];
        }

        return selectedOptions.every((option) =>
          matchesCourseFilter(course, option),
        );
      },
    );

  });

  const handleResetFilters = () => {
    setKeyword("");
    setProfessorKeyword("");
    setSelectedFilters({});
  };

  const toggleCourse = (course: CourseListItem) => {
    const exists = selected.some(
      (item) => item.id === course.id,
    );

    if (exists) {
      setSelected((prev) =>
        prev.filter(
          (item) => item.id !== course.id,
        ),
      );
      return;
    }

    if (
      selected.length >= 6 ||
      totalCredits + course.credit > 18
    ) {
      return;
    }

    setSelected((prev) => [...prev, course]);
  };

  const generateAi = () => {
    setAiLoading(true);

    setTimeout(() => {
      setAiLoading(false);

      setAiMessage(
        "현재 선택 과목 기준으로 공강과 수업일을 고려한 시간표를 찾았습니다.",
      );
    }, 700);
  };

  return (
    <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 bg-[#f5f6f9] font-['Pretendard',sans-serif] text-[#20212b] min-[701px]:grid-cols-[210px_minmax(0,1fr)]">
      <aside className="flex min-h-auto flex-col bg-[#20212a] px-3.5 py-6 text-[#d7d8df] min-[701px]:min-h-[calc(100vh-72px)]">
        <div className="whitespace-nowrap px-3 text-[15px] font-extrabold leading-tight tracking-[-0.5px] text-white">
          수강 신청
        </div>

        <div className="px-3 pb-6 pt-1 text-[10px] text-[#858796]">
          2026학년도 2학기
        </div>

        <nav className="hidden flex-col gap-1 min-[701px]:flex">
          {[
            ["▦", "대시보드"],
            ["⌕", "수강신청"],
            ["✦", "AI 시간표 추천"],
            ["i", "공지사항"],
          ].map(([icon, label]) => (
            <button
              key={label}
              onClick={() => setActiveMenu(label)}
              className={`rounded-lg px-3 py-3 text-left text-[11px] transition ${activeMenu === label
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

        {user && (
          <div className="mt-auto hidden border-t border-[#373843] pt-4 min-[701px]:block">
            <div className="rounded-lg bg-[#2d2e38] px-3 py-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ece9ff] text-xs font-extrabold text-[#7658e9]">
                  {user.name.slice(0, 1)}
                </div>

                <div className="min-w-0">
                  <strong className="block truncate text-[11px] font-bold text-white">
                    {user.name}
                  </strong>

                  <small className="mt-1 block truncate text-[9px] text-[#858796]">
                    {user.major} · {user.grade}학년
                  </small>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#3b3c46] pt-3">
                <div>
                  <span className="block text-[8px] text-[#858796]">
                    학번
                  </span>

                  <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                    {user.studentId}
                  </strong>
                </div>

                <div>
                  <span className="block text-[8px] text-[#858796]">
                    이수 학점
                  </span>

                  <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                    {user.completedCredits}학점
                  </strong>
                </div>

                <div>
                  <span className="block text-[8px] text-[#858796]">
                    최대 신청
                  </span>

                  <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                    {user.maxCredits}학점
                  </strong>
                </div>

                <div>
                  <span className="block text-[8px] text-[#858796]">
                    졸업 필요
                  </span>

                  <strong className="mt-0.5 block text-[9px] font-medium text-[#d7d8df]">
                    {user.graduationCredits}학점
                  </strong>
                </div>

                <div className="col-span-2 mt-3 border-t border-[#3b3c46] pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "학생 정보를 초기화하시겠습니까?",
                        )
                      ) {
                        resetUser();
                        navigate("/");
                      }
                    }}
                    className="w-full rounded-md bg-[#383944] py-1.5 text-[9px] font-medium text-[#a8a9b4] transition hover:bg-[#444550] hover:text-white"
                  >
                    학생 정보 초기화
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="mx-auto w-full max-w-[1500px] min-w-0 px-4 py-6 min-[1101px]:px-7">
        <section className="flex flex-col gap-3 min-[701px]:flex-row min-[701px]:items-center min-[701px]:justify-between">
          <div className="mt-3 mb-3 ml-auto grid w-full grid-cols-3 gap-2 min-[701px]:w-auto">
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
                {totalCredits}/{user?.maxCredits}
              </strong>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 items-start gap-4 min-[1101px]:grid-cols-[minmax(0,1.35fr)_minmax(440px,1fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
            {activeMenu === "대시보드" && (
              <CourseSearch
                keyword={keyword}
                setKeyword={setKeyword}
                professorKeyword={professorKeyword}
                setProfessorKeyword={setProfessorKeyword}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                onReset={handleResetFilters}
                courses={filteredCourses}
                selected={selected}
                toggleCourse={toggleCourse}
              />
            )}
          </section>

          <WeeklyTimetable selected={selected} />
        </div>

        <section className="mt-4 grid gap-4 min-[1101px]:grid-cols-[minmax(0,1.35fr)_minmax(440px,1fr)]">
          <CourseRegistrationList
            selected={selected}
            totalCredits={totalCredits}
          />

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

                <b className="mt-1 block text-[10px]">
                  {5 - activeDaysCount}일
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
              {aiLoading
                ? "AI가 분석 중..."
                : "✦ 최적 시간표 추천받기"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
