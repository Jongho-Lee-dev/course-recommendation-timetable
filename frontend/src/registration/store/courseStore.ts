
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseListItem } from "../../shared/types/database";
import { getSelectionError } from "../utils/courseRules";
import { useUserStore } from "./userStore";
import { toast } from "sonner";
import { readPreTimetable, writePreTimetable } from "./preTimetableStorage";

let preTimetableOwner = useUserStore.getState().user?.studentId;

interface CourseStore {
  catalog: CourseListItem[];
  syncCatalog: (courses: CourseListItem[]) => void;

  selected: CourseListItem[];
  preSelected: CourseListItem[];

  togglePreSelected: (course: CourseListItem) => void;
  removePreSelected: (courseId: number) => void;
  applyPreSelected: () => void;

  favorites: CourseListItem[];

  toggleSelected: (course: CourseListItem) => void;
  setSelected: (courses: CourseListItem[]) => boolean;
  removeSelected: (courseId: number) => void;

  toggleFavorite: (course: CourseListItem) => void;

  clearSelected: () => void;
  clearFavorites: () => void;
}

export const useCourseStore = create<CourseStore>()(
  persist(
    (set, get) => ({
      catalog: [],
      selected: [],
      preSelected: readPreTimetable(preTimetableOwner),
      favorites: [],

      syncCatalog: (courses) =>
        set((state) => {
          const byId = new Map(courses.map((course) => [course.id, course]));

          const refresh = (items: CourseListItem[]) =>
            items.flatMap((item) =>
              byId.has(item.id) ? [byId.get(item.id)!] : [],
            );

          return {
            catalog: courses,
            selected: refresh(state.selected),
            preSelected: refresh(state.preSelected),
            favorites: refresh(state.favorites),
          };
        }),

      // 예비 수강신청
      togglePreSelected: (draft) => {
        if (!preTimetableOwner) return;
        const { preSelected, catalog } = get();

        if (preSelected.some((item) => item.id === draft.id)) {
          set({
            preSelected: preSelected.filter((item) => item.id !== draft.id),
          });
          return;
        }

        const course = catalog.find((item) => item.id === draft.id) ?? draft;

        set({ preSelected: [...preSelected, course] });
      },

      removePreSelected: (courseId) =>
        set((state) => ({
          preSelected: state.preSelected.filter(
            (item) => item.id !== courseId,
          ),
        })),

      // 예비 신청 강좌를 본 수강신청으로 이동
      applyPreSelected: () => {
        const { preSelected, catalog } = get();
        let added = 0;

        for (const draft of preSelected) {
          if (get().selected.some((item) => item.id === draft.id)) continue;

          const course = catalog.find((item) => item.id === draft.id);
          if (!course) continue;

          const error = getSelectionError(
            course,
            get().selected,
            useUserStore.getState().user,
          );

          if (error) continue;

          set((state) => ({
            selected: [...state.selected, course],
          }));

          added += 1;
        }

        toast.success(`${added}개 강좌를 본 수강신청 목록에 추가했습니다.`);
      },

      // 본 수강신청
      setSelected: (courses) => {
        const working: CourseListItem[] = [];

        for (const draft of courses) {
          const course = get().catalog.find(
            (item) => item.id === draft.id,
          );

          if (!course) {
            toast.error("개설되지 않은 강의가 포함되어 있습니다.");
            return false;
          }

          const error = getSelectionError(
            course,
            working,
            useUserStore.getState().user,
          );

          if (error) {
            toast.error(error);
            return false;
          }

          working.push(course);
        }

        set({ selected: working });
        return true;
      },

      toggleSelected: (draft) => {
        const { selected, catalog } = get();

        if (selected.some((item) => item.id === draft.id)) {
          set({
            selected: selected.filter((item) => item.id !== draft.id),
          });
          return;
        }

        const course = catalog.find((item) => item.id === draft.id);

        if (!course) {
          toast.error(
            "개설되지 않은 강의입니다. 강의 정보를 새로고침하세요.",
          );
          return;
        }

        const error = getSelectionError(
          course,
          selected,
          useUserStore.getState().user,
        );

        if (error) {
          toast.error(error);
          return;
        }

        set({ selected: [...selected, course] });
      },

      removeSelected: (courseId) =>
        set((state) => ({
          selected: state.selected.filter((item) => item.id !== courseId),
        })),

      toggleFavorite: (course) =>
        set((state) =>
          state.favorites.some((item) => item.id === course.id)
            ? {
                favorites: state.favorites.filter(
                  (item) => item.id !== course.id,
                ),
              }
            : { favorites: [...state.favorites, course] },
        ),

      clearSelected: () => set({ selected: [] }),
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: "course-storage",
      partialize: ({ selected, favorites }) => ({
        selected,
        favorites,
      }),
      // Legacy shared drafts have no owner; never assign them to a new login.
      merge: (persisted, current) => {
        const saved = persisted as Partial<CourseStore> | null;
        return {
          ...current,
          selected: Array.isArray(saved?.selected) ? saved.selected : [],
          favorites: Array.isArray(saved?.favorites) ? saved.favorites : [],
        };
      },
    },
  ),
);

useCourseStore.subscribe((state, previous) => {
  if (!preTimetableOwner || state.preSelected === previous.preSelected) return;
  try {
    writePreTimetable(preTimetableOwner, state.preSelected);
  } catch {
    toast.error("예비시간표를 브라우저에 저장하지 못했습니다.");
  }
});

useUserStore.subscribe((state) => {
  const nextOwner = state.user?.studentId;
  if (nextOwner === preTimetableOwner) return;
  // Clear ownership during the switch so another user's draft is never written.
  preTimetableOwner = undefined;
  useCourseStore.setState({ preSelected: readPreTimetable(nextOwner) });
  preTimetableOwner = nextOwner;
});
