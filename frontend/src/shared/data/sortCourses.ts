import type { CourseListItem } from "../types/database";

export function sortCourses(
  courses: CourseListItem[],
  sort: string,
): CourseListItem[] {
  return [...courses].sort((a, b) => {
    if (sort === "name")
      return a.title.localeCompare(b.title, "ko") || a.id - b.id;
    if (sort === "credit") return b.credit - a.credit || a.id - b.id;
    return a.id - b.id;
  });
}
