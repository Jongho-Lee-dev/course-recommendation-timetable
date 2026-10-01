import { filterCourses } from '../data/filterCourses';
import { useMemo, useState } from "react";
import type {

  CourseListItem,
} from "../types/database";
import { mockCourses } from "../data/mockCourses";
import {
  createCourseFilters,

} from "../data/CourseFilters";
import WeeklyTimetable from "../components/course/WeeklyTimetable";
import CourseRegistrationList from "../components/course/CourseRegistrationList";
import CourseSearch from "../components/course/CourseSearch";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [professorKeyword, setProfessorKeyword] = useState("");

  const [selectedFilters, setSelectedFilters] = useState<
    Record<number, number[]>
  >({});

  const [selected, setSelected] = useState<CourseListItem[]>(
    mockCourses.slice(0, 2),
  );

  const aiMessage = "AI 추천 기능은 현재 보류 중이며, 추천 페이지 이동만 먼저 연결했습니다.";

  // 관리자 필터 설정 목업 사용
  const courseFilters = useMemo(
    () => createCourseFilters(),
    [],
  );

  const totalCredits = selected.reduce(
    (sum, item) => sum + item.credit,
    0,
  );

  const activeDaysCount = new Set(
    selected.flatMap((course) =>
      course.schedules.map(
        (schedule) => schedule.dayOfWeek,
      ),
    ),
  ).size;

  const filteredCourses = filterCourses(mockCourses, courseFilters, keyword, professorKeyword, selectedFilters);

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

  return (
    <main className="mx-auto w-full max-w-[1500px] min-w-0 bg-[#f5f6f9] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
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
              {totalCredits}/18
            </strong>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 items-start gap-4 min-[1101px]:grid-cols-[minmax(0,1.35fr)_minmax(440px,1fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
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
            type="button"
            className="w-full rounded-md bg-white px-3 py-2 text-[10px] font-bold text-[#272532] transition hover:bg-[#f1efff] disabled:cursor-wait disabled:opacity-60"
            onClick={() => navigate("/ai")}
          >
            ✦ AI 시간표 추천 페이지로 이동
          </button>
        </div>
      </section>
    </main>
  );
}
