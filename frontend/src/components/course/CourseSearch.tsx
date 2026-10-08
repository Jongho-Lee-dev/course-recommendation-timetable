import type { Dispatch, SetStateAction } from "react";
import type { CourseFilter, CourseListItem } from "../../types/database";
import CourseFilters from "./CourseFilters";
import CourseTable from "./CourseTable";

type CourseSearchProps = {
  filters: CourseFilter[];
  keyword: string;
  setKeyword: Dispatch<SetStateAction<string>>;

  professorKeyword: string;
  setProfessorKeyword: Dispatch<SetStateAction<string>>;

  selectedFilters: Record<number, number[]>;
  setSelectedFilters: Dispatch<SetStateAction<Record<number, number[]>>>;

  onReset: () => void;
  sort: string;
  setSort: Dispatch<SetStateAction<string>>;

  courses: CourseListItem[];
  selected: CourseListItem[];
  toggleCourse: (course: CourseListItem) => void;
  favorites: CourseListItem[];
  toggleFavorite: (course: CourseListItem) => void;
};

export default function CourseSearch({
  filters,
  keyword,
  setKeyword,
  professorKeyword,
  setProfessorKeyword,
  selectedFilters,
  setSelectedFilters,
  onReset,
  sort,
  setSort,
  courses,
  selected,
  toggleCourse,
  favorites,
  toggleFavorite,
}: CourseSearchProps) {
  return (
    <>
      <div className="border-b border-[#ececf0] px-5 py-4">
        <h2 className="text-sm font-bold">강의 검색</h2>

        <p className="mt-1 text-[9px] text-[#9699a7]">
          원하는 조건으로 강좌를 검색하세요.
        </p>
      </div>

      <CourseFilters
        filters={filters}
        keyword={keyword}
        setKeyword={setKeyword}
        professorKeyword={professorKeyword}
        setProfessorKeyword={setProfessorKeyword}
        selectedFilters={selectedFilters}
        setSelectedFilters={setSelectedFilters}
        onReset={onReset}
        sort={sort}
        setSort={setSort}
      />

      <CourseTable
        courses={courses}
        selected={selected}
        toggleCourse={toggleCourse}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      />
    </>
  );
}
