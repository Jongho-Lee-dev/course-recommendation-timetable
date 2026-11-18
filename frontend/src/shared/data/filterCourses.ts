import type {
  CourseFilter,
  CourseFilterOption,
  CourseListItem,
} from "../types/database";
import { matchesCourseFilter } from "./CourseFilters";

export function filterCourses(
  courses: CourseListItem[],
  courseFilters: CourseFilter[],
  keyword: string,
  professorKeyword: string,
  selectedFilters: Record<number, number[]>,
): CourseListItem[] {
  return courses.filter((course) => {
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

    return Object.entries(selectedFilters).every(([filterId, selectedPath]) => {
      if (selectedPath.length === 0) {
        return true;
      }

      const filter = courseFilters.find((item) => item.id === Number(filterId));

      if (!filter) {
        return true;
      }

      if (!matchesCourseFilter(course, filter)) {
        return false;
      }

      if (!filter.isFixed && selectedPath[0] === 0) {
        return true;
      }

      let options = filter.options;
      const selectedOptions: CourseFilterOption[] = [];

      for (const selectedId of selectedPath) {
        if (selectedId === 0) {
          break;
        }

        const option = options.find((item) => item.id === selectedId);

        if (!option) {
          return false;
        }

        selectedOptions.push(option);
        options = option.children ?? [];
      }

      return selectedOptions.every((option) =>
        matchesCourseFilter(course, option),
      );
    });
  });
}
