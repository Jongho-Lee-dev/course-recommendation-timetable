import type { CourseListItem } from "../../shared/types/database";
import { isExcludedFromCourse } from "../data/courseEligibility";

export function getSelectionError(course: CourseListItem, selected: CourseListItem[], user: {
  departmentId?: number; major: string; maxCredits: number;
} | null): string | null {
  if (course.isFull || (course.remainingSeats !== undefined && course.remainingSeats <= 0)) return "정원이 마감된 강의입니다.";
  if (isExcludedFromCourse(course, user)) return "소속 전공이 수강 제외 대상입니다.";
  if (selected.some(item => item.courseCode === course.courseCode)) return "같은 과목의 다른 분반을 이미 선택했습니다.";
  if (selected.some(item => findConflict(item, course))) return "선택한 강의와 수업 시간이 겹칩니다.";
  if (selected.length >= 6 || getTotalCredits(selected) + course.credit > (user?.maxCredits ?? 18)) return "선택 가능한 과목 수 또는 학점을 초과합니다.";
  return null;
}

export function getTotalCredits(courses: CourseListItem[]) {
  return courses.reduce((sum, course) => sum + course.credit, 0);
}

export function findConflict(a: CourseListItem, b: CourseListItem) {
  if (a.isOnline || b.isOnline) return null;
  for (const first of a.schedules) {
    for (const second of b.schedules) {
      if (
        first.dayOfWeek === second.dayOfWeek &&
        first.startPeriod <= second.endPeriod &&
        first.endPeriod >= second.startPeriod
      ) {
        return {
          day: first.dayOfWeek,
          firstTime: `${first.startPeriod}~${first.endPeriod}교시`,
          secondTime: `${second.startPeriod}~${second.endPeriod}교시`,
        };
      }
    }
  }
  return null;
}

export function getConflicts(courses: CourseListItem[]) {
  const conflicts: Array<{
    first: CourseListItem;
    second: CourseListItem;
    detail: NonNullable<ReturnType<typeof findConflict>>;
  }> = [];
  for (let i = 0; i < courses.length; i += 1) {
    for (let j = i + 1; j < courses.length; j += 1) {
      const detail = findConflict(courses[i], courses[j]);
      if (detail)
        conflicts.push({ first: courses[i], second: courses[j], detail });
    }
  }
  return conflicts;
}
