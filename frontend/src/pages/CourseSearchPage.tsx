
import { useMemo, useState } from "react";
import { BookOpen, Heart, ListFilter, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import CourseFilters from "../components/course/CourseFilters";
import CourseTable from "../components/course/CourseTable";
import CourseDetailModal from "../components/course/CourseDetailModal";
import { createCourseFilters, matchesCourseFilter } from "../data/CourseFilters";
import { sortCourses } from "../data/sortCourses";
import { useCourseCatalogStore } from "../store/courseCatalogStore";
import { useCourseStore } from "../store/courseStore";
import type { CourseFilterOption, CourseListItem } from "../types/database";

export default function CourseSearchPage() {
  const courses = useCourseCatalogStore(state => state.courses);

  const [keyword, setKeyword] = useState("");
  const [professorKeyword, setProfessorKeyword] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<number, number[]>>({});
  const [sort, setSort] = useState("default");
  const [detail, setDetail] = useState<CourseListItem | null>(null);
  const [mobileFilter, setMobileFilter] = useState(false);

  const selected = useCourseStore(s => s.selected);
  const favorites = useCourseStore(s => s.favorites);
  const toggleSelected = useCourseStore(s => s.toggleSelected);
  const toggleFavorite = useCourseStore(s => s.toggleFavorite);

  const courseFilters = useMemo(
    () => createCourseFilters(courses),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const result = courses.filter(course => {
      const keywordMatch =
        !keyword.trim() ||
        `${course.title} ${course.courseCode}`
          .toLowerCase()
          .includes(keyword.toLowerCase());

      const professorMatch =
        !professorKeyword.trim() ||
        course.professorName
          .toLowerCase()
          .includes(professorKeyword.toLowerCase());

      if (!keywordMatch || !professorMatch) return false;

      return Object.entries(selectedFilters).every(([filterId, path]) => {
        if (!path.length) return true;

        const filter = courseFilters.find(
          item => item.id === Number(filterId)
        );

        if (!filter || !matchesCourseFilter(course, filter)) return false;
        if (!filter.isFixed && path[0] === 0) return true;

        let options = filter.options;
        const chosen: CourseFilterOption[] = [];

        for (const id of path) {
          if (id === 0) break;

          const option = options.find(item => item.id === id);
          if (!option) return false;

          chosen.push(option);
          options = option.children ?? [];
        }

        return chosen.every(option => matchesCourseFilter(course, option));
      });
    });

    return sortCourses(result, sort);
  }, [
    courses,
    keyword,
    professorKeyword,
    selectedFilters,
    courseFilters,
    sort
  ]);

  const totalCredits = selected.reduce(
    (sum, c) => sum + c.credit,
    0
  );

  const reset = () => {
    setKeyword("");
    setProfessorKeyword("");
    setSelectedFilters({});
    setSort("default");
  };

  const toggleCourse = (course: CourseListItem) => {
    const exists = selected.some(item => item.id === course.id);

    if (!exists && (selected.length >= 6 || totalCredits + course.credit > 18)) {
      toast.error("최대 18학점까지 선택할 수 있습니다.");
      return;
    }

    toggleSelected(course);
  };

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
      <section className="overflow-hidden rounded-2xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
        <header className="border-b border-[#ececf0] px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eee9ff] text-[#7658e9]">
                <BookOpen size={18} />
              </div>

              <div>
                <h1 className="text-sm font-extrabold">
                  강의 검색
                </h1>
                <p className="mt-1 text-[9px] text-[#9699a7]">
                  강좌를 찾고 상세 정보를 확인한 뒤 시간표에 추가하세요.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-[#f6f3ff] px-3 py-2 text-[9px] font-bold text-[#7658e9]">
                선택 {selected.length}개 · {totalCredits}/18학점
              </div>

              <button
                onClick={() => setMobileFilter(v => !v)}
                className="rounded-lg border border-[#dedfe5] p-2 text-[#777985] min-[801px]:hidden"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>
        </header>

        <div className={`${mobileFilter ? "block" : "hidden"} min-[801px]:block`}>
          <CourseFilters
            filters={courseFilters}
            keyword={keyword}
            setKeyword={setKeyword}
            professorKeyword={professorKeyword}
            setProfessorKeyword={setProfessorKeyword}
            selectedFilters={selectedFilters}
            setSelectedFilters={setSelectedFilters}
            onReset={reset}
            sort={sort}
            setSort={setSort}
          />
        </div>

        <div className="flex items-center justify-between border-y border-[#f0f0f3] bg-[#fafafd] px-5 py-3">
          <span className="flex items-center gap-1.5 text-[9px] text-[#777985]">
            <ListFilter size={12} />
            검색 결과
            <b className="text-[#30313b]">
              {filteredCourses.length}개
            </b>
          </span>

          <span className="text-[8px] text-[#a0a3ae]">
            강좌명을 누르면 상세 정보를 확인할 수 있습니다.
          </span>
        </div>

        <CourseTable
          courses={filteredCourses}
          selected={selected}
          toggleCourse={toggleCourse}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onCourseClick={setDetail}
        />
      </section>

      <div className="mt-4 grid gap-4 min-[901px]:grid-cols-2">
        <section className="rounded-xl border border-[#e3e4e9] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold">
              선택한 강좌
            </h2>

            <span className="text-[9px] text-[#7658e9]">
              {selected.length}/6과목
            </span>
          </div>

          {selected.length === 0 ? (
            <p className="mt-4 text-[10px] text-[#9699a7]">
              강의 검색 결과에서 신청을 누르면 이곳에 표시됩니다.
            </p>
          ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {selected.map(c => (
                <button
                  key={c.id}
                  onClick={() => setDetail(c)}
                  className="rounded-lg bg-[#fafafd] p-3 text-left hover:bg-[#f6f3ff]"
                >
                  <b className="block text-[10px]">
                    {c.title}
                  </b>

                  <span className="mt-1 block text-[8px] text-[#9699a7]">
                    {c.courseCode} · {c.credit}학점
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#e3e4e9] bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold">
              관심강좌
            </h2>

            <Heart size={15} className="text-[#7658e9]" />
          </div>

          <p className="mt-2 text-[9px] text-[#9699a7]">
            관심 버튼을 눌러 나중에 다시 볼 강의를 저장할 수 있습니다.
          </p>

          <div className="mt-3 text-[9px] font-semibold text-[#7658e9]">
            현재 {favorites.length}개 저장됨
          </div>
        </section>
      </div>

      {detail && (
        <CourseDetailModal
          course={detail}
          isFavorite={favorites.some(c => c.id === detail.id)}
          isSelected={selected.some(c => c.id === detail.id)}
          onClose={() => setDetail(null)}
          onToggleFavorite={() => toggleFavorite(detail)}
          onToggleSelected={() => toggleCourse(detail)}
        />
      )}
    </main>
  );
}
