import type { CourseListItem } from "../../shared/types/database";
import { departments } from "../../shared/data/departments";

type StudentAffiliation = {
  major: string;
  collegeName?: string;
  facultyName?: string;
};

export function isExcludedFromCourse(
  course: CourseListItem,
  user: StudentAffiliation | null,
): boolean {
  if (!user) return false;

  return departments.some(
    (department) =>
      department.majorName === user.major &&
      (!user.collegeName || department.collegeName === user.collegeName) &&
      (!user.facultyName || department.facultyName === user.facultyName) &&
      course.excludedDepartmentIds?.includes(department.id),
  );
}
