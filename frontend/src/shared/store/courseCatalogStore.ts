import { create } from "zustand";
import type { CourseListItem } from "../types/database";

interface CourseCatalogStore {
  loaded: boolean;
  courses: CourseListItem[];
  syllabi: Record<number, File>;
  setCourses: (courses: CourseListItem[]) => void;
  setSyllabus: (courseId: number, file: File | null) => void;
}

export const useCourseCatalogStore = create<CourseCatalogStore>((set) => ({
  loaded: false,
  courses: [],
  syllabi: {},
  setCourses: (courses) =>
    set((state) => ({
      courses: courses.map(course => ({ ...course, remainingSeats: Math.max(0, course.capacity - (course.enrolledCount ?? 0)), isFull: (course.enrolledCount ?? 0) >= course.capacity })),
      loaded: true,
      syllabi: Object.fromEntries(
        Object.entries(state.syllabi).filter(([id]) =>
          courses.some((course) => course.id === Number(id)),
        ),
      ),
    })),
  setSyllabus: (courseId, file) =>
    set((state) => {
      const syllabi = { ...state.syllabi };
      if (file) syllabi[courseId] = file;
      else delete syllabi[courseId];
      return { syllabi };
    }),
}));
