import { create } from "zustand";

export type RegistrationPreview = {
  startsAt: number;
  endsAt: number;
  stopped: boolean;
};

type RegistrationStore = {
  preview: RegistrationPreview | null;
  updatedAt: number;
  setPreview: (preview: RegistrationPreview | null) => void;
};

export const useRegistrationStore = create<RegistrationStore>()((set) => ({
  preview: null,
  updatedAt: 0,
  setPreview: (preview) => set({ preview, updatedAt: Date.now() }),
}));

export function getRegistrationSummary(
  preview: RegistrationPreview | null,
  now: number,
) {
  const status = !preview
    ? "idle"
    : preview.stopped || now >= preview.endsAt
      ? "closed"
      : now < preview.startsAt
        ? "scheduled"
        : "open";
  const labels = {
    idle: "설정 전",
    scheduled: "예약 대기",
    open: "진행 중",
    closed: "종료",
  };
  let remaining = "—";

  if (preview && (status === "scheduled" || status === "open")) {
    const target = status === "scheduled" ? preview.startsAt : preview.endsAt;
    const seconds = Math.max(0, Math.ceil((target - now) / 1000));
    const days = Math.floor(seconds / 86400);
    const time = [
      Math.floor(seconds / 3600) % 24,
      Math.floor(seconds / 60) % 60,
      seconds % 60,
    ]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
    remaining = `${days ? `${days}일 ` : ""}${time}`;
  }

  return {
    status,
    statusLabel: labels[status],
    remaining,
    remainingLabel:
      status === "scheduled"
        ? "시작까지 남은 시간"
        : status === "open"
          ? "종료까지 남은 시간"
          : "남은 시간",
  };
}
