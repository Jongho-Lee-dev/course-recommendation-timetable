import { create } from "zustand";

import type { CourseListItem } from "../types/database";

interface CourseCatalogStore {
  courses: CourseListItem[];
  setCourses: (courses: CourseListItem[]) => void;
}

export const useCourseCatalogStore = create<CourseCatalogStore>((set) => ({
  courses: [],
  setCourses: (courses) => set({ courses }),
}));
