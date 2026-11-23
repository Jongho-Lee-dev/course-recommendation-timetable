import { create } from "zustand";
import { api } from "../api";

export type RegistrationPreview = {
  startsAt: number;
  endsAt: number;
  stopped: boolean;
};

type PeriodResponse = {
  period: RegistrationPreview | null;
  status: string;
  serverTime: number;
};

type RegistrationStore = {
  preview: RegistrationPreview | null;
  // 서버 시간 - 이 컴퓨터 시간. 남은 시간을 서버 기준으로 계산합니다.
  offset: number;
  updatedAt: number;
  loaded: boolean;
  error: string | null;
  load: (force?: boolean) => Promise<void>;
  save: (startsAt: number | null, endsAt: number) => Promise<void>;
  stop: () => Promise<void>;
};

// 여러 화면이 동시에 불러도 요청은 한 번만 보냅니다.
let inflight: Promise<void> | null = null;
let lastLoadedAt = 0;

export const useRegistrationStore = create<RegistrationStore>()((set) => {
  const apply = (result: PeriodResponse) => {
    lastLoadedAt = Date.now();
    set({
      preview: result.period,
      offset: result.serverTime - Date.now(),
      updatedAt: Date.now(),
      loaded: true,
      error: null,
    });
  };
  return {
    preview: null,
    offset: 0,
    updatedAt: 0,
    loaded: false,
    error: null,
    load: (force = false) => {
      if (inflight) return inflight;
      if (!force && Date.now() - lastLoadedAt < 10_000) return Promise.resolve();
      inflight = api<PeriodResponse>("/registration-period")
        .then(apply)
        .catch((error) =>
          set({
            error:
              error instanceof Error
                ? error.message
                : "수강신청 기간을 불러오지 못했습니다.",
          }),
        )
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
    save: async (startsAt, endsAt) => {
      apply(
        await api<PeriodResponse>("/admin/registration-period", {
          method: "PUT",
          body: JSON.stringify({ startsAt, endsAt }),
        }),
      );
    },
    stop: async () => {
      apply(
        await api<PeriodResponse>("/admin/registration-period/stop", {
          method: "POST",
        }),
      );
    },
  };
});

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

// 신청이 막혔을 때 학생에게 보여줄 문구
export function registrationClosedMessage(
  status: string,
  preview: RegistrationPreview | null,
) {
  if (status === "open") return "";
  if (status === "idle") return "수강신청 기간이 아직 정해지지 않았습니다.";
  const format = (value: number) =>
    new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(value);
  const range = preview
    ? ` (${format(preview.startsAt)} ~ ${format(preview.endsAt)})`
    : "";
  return status === "scheduled"
    ? `아직 수강신청 기간이 아닙니다${range}.`
    : `수강신청 기간이 끝났습니다${range}.`;
}
