import { create } from "zustand";
import { toast } from "sonner";
import { api } from "../../shared/api";
import type { CourseListItem } from "../../shared/types/database";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";
import { useUserStore } from "./userStore";

type EnrollmentState = {
  studentId: string;
  courses: CourseListItem[];
  enrolled: CourseListItem[];
};
type EnrollmentStore = {
  enrolled: CourseListItem[];
  loading: boolean;
  busy: boolean;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  change: (ids: number[], action: "add" | "cancel") => Promise<boolean>;
};

// Session and request versions prevent old responses from overwriting a newer save.
let version = 0;
const session = () => sessionStorage.getItem("student-token");
export const useEnrollmentStore = create<EnrollmentStore>((set, get) => {
  const apply = (result: EnrollmentState) => {
    if (result.studentId !== useUserStore.getState().user?.studentId)
      throw new Error("로그인 정보가 변경되었습니다. 다시 로그인해주세요.");
    useCourseCatalogStore.getState().setCourses(result.courses);
    set({ enrolled: result.enrolled, loaded: true, error: null });
  };
  return {
    enrolled: [], loading: false, busy: false, loaded: false, error: null,
    load: async () => {
      if (get().busy) return;
      const token = session();
      const request = ++version;
      if (!token || !useUserStore.getState().user) {
        set({ enrolled: [], loaded: false, loading: false });
        return;
      }
      set({ loading: true, error: null });
      try {
        const result = await api<EnrollmentState>("/enrollments", {}, "student");
        if (request === version && token === session()) apply(result);
      } catch (error) {
        if (request === version && token === session())
          set({ error: error instanceof Error ? error.message : "신청내역을 불러오지 못했습니다." });
      } finally {
        if (request === version) set({ loading: false });
      }
    },
    change: async (ids, action) => {
      if (get().busy) return false;
      const token = session();
      if (!token || !useUserStore.getState().user) {
        toast.error("로그인이 필요합니다.");
        return false;
      }
      if (!ids.length) return false;
      const request = ++version;
      set({ busy: true, loading: false, error: null });
      try {
        const result = await api<EnrollmentState>("/enrollments", {
          method: "POST", body: JSON.stringify({ courseIds: ids, action }),
        }, "student");
        if (request !== version || token !== session()) return false;
        apply(result);
        toast.success(action === "add" ? "수강신청이 완료되었습니다." : "수강신청을 취소했습니다.");
        return true;
      } catch (error) {
        if (request === version && token === session()) {
          const message = error instanceof Error ? error.message : "수강신청 처리에 실패했습니다.";
          set({ error: message });
          toast.error(message);
        }
        return false;
      } finally {
        if (request === version) set({ busy: false });
      }
    },
  };
});

useUserStore.subscribe((state, previous) => {
  if (state.user?.studentId === previous.user?.studentId) return;
  version++;
  useEnrollmentStore.setState({ enrolled: [], loaded: false, busy: false, loading: false, error: null });
});
