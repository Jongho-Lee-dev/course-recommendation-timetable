import { useUserStore } from "./userStore";
import { api } from "../../shared/api";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";
import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseListItem } from "../../shared/types/database";

let enrollmentRevision = 0;

type EnrollmentState = {
  studentId: string;
  courses: CourseListItem[];
  enrolled: CourseListItem[];
};
interface CourseStore {
  enrollmentBusy: boolean;
  loadEnrollments: () => Promise<void>;
  changeEnrollments: (
    ids: number[],
    action: "add" | "cancel" | "replace",
  ) => Promise<boolean>;

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

export const useCourseStore = create<CourseStore>()(
  persist(
    (set, get) => ({
      enrollmentBusy: false,
      loadEnrollments: async () => {
        if (get().enrollmentBusy) return;
        const revision = enrollmentRevision;
        const token = sessionStorage.getItem("student-token");
        if (!token) {
          set({ selected: [], history: [] });
          return;
        }
        const result = await api<EnrollmentState>(
          "/enrollments",
          {},
          "student",
        );
        if (
          revision !== enrollmentRevision ||
          token !== sessionStorage.getItem("student-token") ||
          get().enrollmentBusy ||
          useUserStore.getState().user?.studentId !== result.studentId
        )
          return;
        useCourseCatalogStore.getState().setCourses(result.courses);
        set({ selected: result.enrolled, history: result.enrolled });
      },
      changeEnrollments: async (ids, action) => {
        if (get().enrollmentBusy) return false;
        if (!sessionStorage.getItem("student-token")) {
          toast.error("학생 정보 등록 후 신청하세요. 학생 세션이 없습니다.");
          return false;
        }
        enrollmentRevision += 1;
        set({ enrollmentBusy: true });
        try {
          const result = await api<EnrollmentState>(
            "/enrollments",
            {
              method: "POST",
              body: JSON.stringify({ courseIds: ids, action }),
            },
            "student",
          );
          useCourseCatalogStore.getState().setCourses(result.courses);
          set({ selected: result.enrolled, history: result.enrolled });
          toast.success(
            action === "cancel"
              ? "수강신청을 취소했습니다."
              : "수강신청을 DB에 반영했습니다.",
          );
          return true;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "수강신청 처리 실패");
          return false;
        } finally {
          set({ enrollmentBusy: false });
        }
      },
      selected: [],
      favorites: [],
      history: [],
      setSelected: (courses) => {
        void get().changeEnrollments(
          courses.map((c) => c.id),
          "replace",
        );
      },
      toggleSelected: (course) => {
        void get().changeEnrollments(
          [course.id],
          get().selected.some((c) => c.id === course.id) ? "cancel" : "add",
        );
      },
      removeSelected: (courseId) => {
        void get().changeEnrollments([courseId], "cancel");
      },
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
      addHistory: (course) => {
        void get().changeEnrollments([course.id], "add");
      },
      removeHistory: (courseId) => {
        void get().changeEnrollments([courseId], "cancel");
      },
      clearSelected: () => {
        void get().changeEnrollments([], "replace");
      },
      clearFavorites: () => set({ favorites: [] }),
      clearHistory: () => {
        void get().changeEnrollments([], "replace");
      },
    }),
    {
      name: "course-storage",
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);
