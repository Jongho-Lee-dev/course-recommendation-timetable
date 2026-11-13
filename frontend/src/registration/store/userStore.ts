import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  departmentId?: number;
  studentId: string;
  departmentId: number;
  name: string;
  grade: number;
  collegeName?: string;
  facultyName?: string;
  major: string;
  completedCredits: number;
  graduationCredits: number;
  maxCredits: number;
}

interface UserStore {
  user: User | null;
  setUser: (newUser: User | null) => void;
  reset: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,

      setUser: (newUser) =>
        set({
          user: newUser,
        }),

      reset: () => {
        sessionStorage.removeItem("student-token");
        set({ user: null });
      },
    }),
    {
      name: "user-storage",
      merge: (persisted, current) => {
        const candidate = (persisted as { user?: User } | null)?.user;
        const valid = candidate && typeof candidate.name === "string" && candidate.name.trim() && typeof candidate.studentId === "string" && typeof candidate.major === "string" && typeof candidate.grade === "number";
        return { ...current, user: valid ? candidate : null };
      },
    },
  ),
);
