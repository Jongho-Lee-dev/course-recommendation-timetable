import type { CourseListItem } from "../types/database";

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
