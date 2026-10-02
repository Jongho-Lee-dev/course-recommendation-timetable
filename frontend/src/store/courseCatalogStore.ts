import { create } from "zustand";
import { mockCourses } from "../data/mockCourses";
import type { CourseListItem } from "../types/database";

interface CourseCatalogStore {
  courses: CourseListItem[];
  syllabi: Record<number, File>;
  setCourses: (courses: CourseListItem[]) => void;
  setSyllabus: (courseId: number, file: File | null) => void;
}

// Files live separately from the persisted selection/favorites snapshots.
export const useCourseCatalogStore = create<CourseCatalogStore>((set) => ({
  courses: mockCourses,
  syllabi: {},
  setCourses: (courses) => set((state) => ({
    courses,
    syllabi: Object.fromEntries(Object.entries(state.syllabi).filter(([id]) => courses.some((course) => course.id === Number(id)))),
  })),
  setSyllabus: (courseId, file) => set((state) => {
    const syllabi = { ...state.syllabi };
    if (file) syllabi[courseId] = file;
    else delete syllabi[courseId];
    return { syllabi };
  }),
}));
