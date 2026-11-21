import type { CourseListItem } from "../../shared/types/database";

const key = (studentId: string) => `pre-timetable:${encodeURIComponent(studentId)}`;

export function readPreTimetable(studentId?: string): CourseListItem[] {
  if (!studentId) return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(studentId)) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is CourseListItem =>
          item !== null && typeof item === "object" && typeof item.id === "number" &&
          typeof item.title === "string" && typeof item.credit === "number" &&
          Array.isArray(item.schedules))
      : [];
  } catch {
    return [];
  }
}

export function writePreTimetable(studentId: string, courses: CourseListItem[]) {
  localStorage.setItem(key(studentId), JSON.stringify(courses));
}

