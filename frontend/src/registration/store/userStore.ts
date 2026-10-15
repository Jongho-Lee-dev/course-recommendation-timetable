import { create } from "zustand";

interface User {
  studentId: string;
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

// API 연결 전 화면 개발용 임시 데이터입니다.
export const mockUser: User = {
  studentId: "20230001",
  name: "홍길동",
  grade: 3,
  collegeName: "AI·SW창의융합대학",
  facultyName: "컴퓨터소프트웨어학부",
  major: "컴퓨터공학과",
  completedCredits: 72,
  graduationCredits: 130,
  maxCredits: 18,
};

export const useUserStore = create<UserStore>()((set) => ({
  user: mockUser,
  setUser: (user) => set({ user }),
  reset: () => set({ user: null }),

  /*
    persist(
    (set) => ({
      user: null,

      setUser: (newUser) =>
        set({
          user: newUser,
        }),

      reset: () => set({ user: null }),
    }),
    {
      name: "user-storage",
    },
  ),
  */
}));
