import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseListItem } from "../types/database";

interface CourseStore {
  selected: CourseListItem[];
  favorites: CourseListItem[];
  history: CourseListItem[];
  toggleSelected: (course: CourseListItem) => void;
  setSelected: (courses: CourseListItem[]) => void;
  removeSelected: (courseId: number) => void;
  toggleFavorite: (course: CourseListItem) => void;
  addHistory: (course: CourseListItem) => void;
  removeHistory: (courseId: number) => void;
  clearSelected: () => void;
  clearFavorites: () => void;
  clearHistory: () => void;
}

export const useCourseStore = create<CourseStore>()(persist((set) => ({
  selected: [], favorites: [], history: [],
  setSelected: (courses) => set({ selected: courses }),
  toggleSelected: (course) => set(state => state.selected.some(item => item.id === course.id) ? { selected: state.selected.filter(item => item.id !== course.id) } : { selected: [...state.selected, course] }),
  removeSelected: (courseId) => set(state => ({ selected: state.selected.filter(item => item.id !== courseId) })),
  toggleFavorite: (course) => set(state => state.favorites.some(item => item.id === course.id) ? { favorites: state.favorites.filter(item => item.id !== course.id) } : { favorites: [...state.favorites, course] }),
  addHistory: (course) => set(state => ({ history: state.history.some(item => item.id === course.id) ? state.history : [...state.history, course] })),
  removeHistory: (courseId) => set(state => ({ history: state.history.filter(item => item.id !== courseId) })),
  clearSelected: () => set({ selected: [] }),
  clearFavorites: () => set({ favorites: [] }),
  clearHistory: () => set({ history: [] }),
}), { name: "course-storage" }));
