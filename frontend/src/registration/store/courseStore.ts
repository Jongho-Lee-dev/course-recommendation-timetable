import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseListItem } from "../../shared/types/database";
import { getSelectionError } from "../utils/courseRules";
import { useUserStore } from "./userStore";
import { toast } from "sonner";

interface CourseStore {
  catalog: CourseListItem[];
  syncCatalog: (courses: CourseListItem[]) => void;
  selected: CourseListItem[];
  favorites: CourseListItem[];
  history: CourseListItem[];
  toggleSelected: (course: CourseListItem) => void;
  setSelected: (courses: CourseListItem[]) => boolean;
  removeSelected: (courseId: number) => void;
  toggleFavorite: (course: CourseListItem) => void;
  addHistory: (course: CourseListItem) => void;
  removeHistory: (courseId: number) => void;
  clearSelected: () => void;
  clearFavorites: () => void;
  clearHistory: () => void;
}

export const useCourseStore = create<CourseStore>()(persist((set, get) => ({
  catalog: [],
  syncCatalog: (courses) => set(state => {
    const byId = new Map(courses.map(course => [course.id, course]));
    const refresh = (items: CourseListItem[]) => items.flatMap(item => byId.has(item.id) ? [byId.get(item.id)!] : []);
    return { catalog: courses, selected: refresh(state.selected), favorites: refresh(state.favorites), history: refresh(state.history) };
  }),
  selected: [], favorites: [], history: [],
  setSelected: (courses) => {
    const working: CourseListItem[] = [];
    for (const draft of courses) {
      const course = get().catalog.find(item => item.id === draft.id);
      if (!course) { toast.error("개설되지 않은 강의가 포함되어 있습니다."); return false; }
      const error = getSelectionError(course, working, useUserStore.getState().user);
      if (error) { toast.error(error); return false; }
      working.push(course);
    }
    set({ selected: working });
    return true;
  },
  toggleSelected: (draft) => {
    const { selected, catalog } = get();
    if (selected.some(item => item.id === draft.id)) {
      set({ selected: selected.filter(item => item.id !== draft.id) }); return;
    }
    const course = catalog.find(item => item.id === draft.id);
    if (!course) { toast.error("개설되지 않은 강의입니다. 강의 정보를 새로고침하세요."); return; }
    const error = getSelectionError(course, selected, useUserStore.getState().user);
    if (error) { toast.error(error); return; }
    set({ selected: [...selected, course] });
  },
  removeSelected: (courseId) => set(state => ({ selected: state.selected.filter(item => item.id !== courseId) })),
  toggleFavorite: (course) => set(state => state.favorites.some(item => item.id === course.id) ? { favorites: state.favorites.filter(item => item.id !== course.id) } : { favorites: [...state.favorites, course] }),
  addHistory: (course) => set(state => ({ history: state.history.some(item => item.id === course.id) ? state.history : [...state.history, course] })),
  removeHistory: (courseId) => set(state => ({ history: state.history.filter(item => item.id !== courseId) })),
  clearSelected: () => set({ selected: [] }),
  clearFavorites: () => set({ favorites: [] }),
  clearHistory: () => set({ history: [] }),
}), { name: "course-storage", partialize: ({ selected, favorites, history }) => ({ selected, favorites, history }) }));
