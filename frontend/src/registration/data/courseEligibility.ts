import type { CourseListItem } from "../../shared/types/database";

type StudentAffiliation = {
  departmentId?: number;
  major: string;
  collegeName?: string;
  facultyName?: string;
};

export function isExcludedFromCourse(
  course: CourseListItem,
  user: StudentAffiliation | null,
): boolean {
  if (!user) return false;

  return user.departmentId !== undefined &&
    (course.excludedDepartmentIds ?? []).includes(user.departmentId);
}
