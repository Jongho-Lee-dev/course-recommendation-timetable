import type { CourseListItem } from "../types/database";

export function getClassificationPath(course: CourseListItem): string[] {
  return course.classificationPath ?? [
    course.category, course.courseType ?? "",
    course.generalEducationArea ?? "", course.generalEducationElectiveArea ?? "",
  ].map((value) => value.trim()).filter(Boolean);
}

export function withClassificationPath(course: CourseListItem, path: string[]): CourseListItem {
  return {
    ...course, classificationPath: path,
    category: path[0] ?? "", courseType: path[1] ?? "",
    generalEducationArea: path[2] ?? "", generalEducationElectiveArea: path[3] ?? "",
  };
}
