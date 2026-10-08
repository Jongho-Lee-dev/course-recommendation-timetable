import { filterCourses } from "../data/filterCourses";
import { sortCourses } from "../data/sortCourses";
import { useMemo, useState } from "react";
import type { CourseListItem } from "../types/database";
import { useCourseCatalogStore } from "../store/courseCatalogStore";
import { createCourseFilters } from "../data/CourseFilters";
import WeeklyTimetable from "../components/course/WeeklyTimetable";
import CourseRegistrationList from "../components/course/CourseRegistrationList";
import CourseSearch from "../components/course/CourseSearch";
import { useNavigate } from "react-router-dom";
import { useRegistrationStatus } from "../hooks/useRegistrationStatus";
import { useCourseStore } from "../store/courseStore";
import { useUserStore } from "../store/userStore";
import { isExcludedFromCourse } from "../data/courseEligibility";
import { toast } from "sonner";
import { getConflicts } from "../utils/courseRules";

export default function MainPage() {
  const navigate = useNavigate();
  const courses = useCourseCatalogStore((state) => state.courses);

  const { status, statusLabel, remaining, remainingLabel } =
    useRegistrationStatus();

  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("default");
  const [professorKeyword, setProfessorKeyword] = useState("");

  const [selectedFilters, setSelectedFilters] = useState<
    Record<number, number[]>
  >({});

  const selected = useCourseStore((state) => state.selected);
  const toggleSelected = useCourseStore((state) => state.toggleSelected);
  const favorites = useCourseStore((state) => state.favorites);
  const toggleFavorite = useCourseStore((state) => state.toggleFavorite);

  const user = useUserStore((state) => state.user);

  const maxCredits = user?.maxCredits ?? 18;

  const aiMessage =
    "현재 시간표를 분석하고 있습니다. AI 추천 페이지에서 원하는 조건을 설정할 수 있습니다.";

  const courseFilters = useMemo(() => createCourseFilters(courses), [courses]);

  const totalCredits = selected.reduce((sum, item) => sum + item.credit, 0);

  const conflictCount = getConflicts(selected).length;

  const activeDaysCount = new Set(
    selected.flatMap((course) =>
      course.schedules.map((schedule) => schedule.dayOfWeek),
    ),
  ).size;

  const filteredCourses = sortCourses(
    filterCourses(
      courses,
      courseFilters,
      keyword,
      professorKeyword,
      selectedFilters,
    ),
    sort,
  );

  const handleResetFilters = () => {
    setSort("default");
    setKeyword("");
    setProfessorKeyword("");
    setSelectedFilters({});
  };

  const toggleCourse = (course: CourseListItem) => {
    const exists = selected.some((item) => item.id === course.id);

    if (!exists && isExcludedFromCourse(course, user)) {
      toast.error("소속 전공이 수강 제외 대상이므로 신청할 수 없습니다.");
      return;
    }

    if (
      !exists &&
      (selected.length >= 6 || totalCredits + course.credit > maxCredits)
    ) {
      return;
    }

    toggleSelected(course);
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] min-w-0 bg-[#f5f6f9] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
      {/* 상단 신청 현황 */}
      <section className="flex flex-col gap-3 min-[701px]:flex-row min-[701px]:items-center min-[701px]:justify-between">
        <div className="mt-3 mb-3 ml-auto grid w-full grid-cols-3 gap-2 min-[701px]:w-auto">
          <div className="min-w-0 rounded-lg border border-[#e4e5eb] bg-white px-3 py-2.5">
            <span className="block text-[9px] text-[#9699a6]">
              수강신청 현황
            </span>

            <strong
              role="status"
              className={`mt-1 block text-xs ${
                status === "open"
                  ? "text-emerald-700"
                  : status === "scheduled"
                    ? "text-[#7658e9]"
                    : "text-[#777985]"
              }`}
            >
              {statusLabel}
            </strong>
          </div>

          <div className="min-w-0 rounded-lg border border-[#e4e5eb] bg-white px-3 py-2.5">
            <span className="block text-[9px] text-[#9699a6]">
              {remainingLabel}
            </span>

            <strong className="mt-1 block text-xs tabular-nums">
              {remaining}
            </strong>
          </div>

          <div className="min-w-0 rounded-lg border border-[#e4e5eb] bg-white px-3 py-2.5">
            <span className="block text-[9px] text-[#9699a6]">신청 학점</span>

            <strong className="mt-1 block text-xs">
              {totalCredits}/{maxCredits}
            </strong>
          </div>
        </div>
      </section>

      {/* 강의 검색 + 시간표 */}
      <div className="grid min-w-0 items-start gap-4 min-[1101px]:grid-cols-[minmax(0,1.35fr)_minmax(440px,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
          <CourseSearch
            filters={courseFilters}
            keyword={keyword}
            setKeyword={setKeyword}
            professorKeyword={professorKeyword}
            setProfessorKeyword={setProfessorKeyword}
            selectedFilters={selectedFilters}
            setSelectedFilters={setSelectedFilters}
            onReset={handleResetFilters}
            sort={sort}
            setSort={setSort}
            courses={filteredCourses}
            selected={selected}
            toggleCourse={toggleCourse}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        </section>

        <WeeklyTimetable selected={selected} />
      </div>

      {/* 신청 강좌 + AI 추천 */}
      <section className="mt-4 grid gap-4 min-[1101px]:grid-cols-[minmax(0,1.35fr)_minmax(440px,1fr)]">
        <CourseRegistrationList
          selected={selected}
          totalCredits={totalCredits}
        />

        <div className="rounded-xl border border-[#282633] bg-[#282633] p-[18px] text-white">
          <div className="text-[8px] font-extrabold tracking-[0.8px] text-[#aa9cf3]">
            AI COURSE PLANNER
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
                비어있는 요일
              </span>

              <b className="mt-1 block text-[10px]">
                {Math.max(0, 5 - activeDaysCount)}일
              </b>
            </div>

            <div className="rounded-md border border-[#3d3b49] bg-[#33313f] p-2">
              <span className="block text-[7px] text-[#9e9ca9]">수업 요일</span>

              <b className="mt-1 block text-[10px]">{activeDaysCount}일</b>
            </div>

            <div className="rounded-md border border-[#3d3b49] bg-[#33313f] p-2">
              <span className="block text-[7px] text-[#9e9ca9]">시간 충돌</span>

              <b
                className={`mt-1 block text-[10px] ${
                  conflictCount === 0 ? "text-[#61d0a4]" : "text-red-400"
                }`}
              >
                {conflictCount}건
              </b>
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-md bg-white px-3 py-2 text-[10px] font-bold text-[#272532] transition hover:bg-[#f1efff]"
            onClick={() => navigate("/ai")}
          >
            AI 시간표 추천 페이지로 이동
          </button>
        </div>
      </section>
    </main>
  );
}
