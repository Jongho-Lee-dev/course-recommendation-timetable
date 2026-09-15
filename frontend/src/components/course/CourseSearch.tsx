
import type { Dispatch, SetStateAction } from "react";
import type { CourseListItem } from "../../types/database";
import CourseFilters from "./CourseFilters";
import CourseTable from "./CourseTable";

type FilterCategory = "all" | "major" | "general";

type CourseSearchProps = {
  keyword: string;
  setKeyword: Dispatch<SetStateAction<string>>;

  professorKeyword: string;
  setProfessorKeyword: Dispatch<SetStateAction<string>>;

  filterCategory: FilterCategory;
  setFilterCategory: Dispatch<SetStateAction<FilterCategory>>;

  selectedDay: string;
  setSelectedDay: Dispatch<SetStateAction<string>>;

  selectedGrade: string;
  setSelectedGrade: Dispatch<SetStateAction<string>>;

  selectedCollege: string;
  setSelectedCollege: Dispatch<SetStateAction<string>>;

  selectedMajor: string;
  setSelectedMajor: Dispatch<SetStateAction<string>>;

  selectedGeneralEducation: string;
  setSelectedGeneralEducation: Dispatch<SetStateAction<string>>;

  selectedGeneralEducationArea: string;
  setSelectedGeneralEducationArea: Dispatch<SetStateAction<string>>;

  selectedGeneralEducationElectiveArea: string;
  setSelectedGeneralEducationElectiveArea: Dispatch<
    SetStateAction<string>
  >;

  onReset: () => void;

  courses: CourseListItem[];
  selected: CourseListItem[];
  toggleCourse: (course: CourseListItem) => void;
};

export default function CourseSearch({
  keyword,
  setKeyword,
  professorKeyword,
  setProfessorKeyword,
  filterCategory,
  setFilterCategory,
  selectedDay,
  setSelectedDay,
  selectedGrade,
  setSelectedGrade,
  selectedCollege,
  setSelectedCollege,
  selectedMajor,
  setSelectedMajor,
  selectedGeneralEducation,
  setSelectedGeneralEducation,
  selectedGeneralEducationArea,
  setSelectedGeneralEducationArea,
  selectedGeneralEducationElectiveArea,
  setSelectedGeneralEducationElectiveArea,
  onReset,
  courses,
  selected,
  toggleCourse,
}: CourseSearchProps) {
  return (
    <>
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
        onReset={onReset}
      />

      <CourseTable
        courses={courses}
        selected={selected}
        toggleCourse={toggleCourse}
      />
    </>
  );
}