import { useEffect, useState } from "react";
import {
  getRegistrationSummary,
  registrationClosedMessage,
  useRegistrationStore,
} from "../store/registrationStore";

// 관리자가 기간을 바꾸면 이 간격 안에 학생 화면에 반영됩니다.
const REFRESH_MS = 30_000;

export function useRegistrationStatus() {
  const preview = useRegistrationStore((state) => state.preview);
  const offset = useRegistrationStore((state) => state.offset);
  const loaded = useRegistrationStore((state) => state.loaded);
  const error = useRegistrationStore((state) => state.error);
  const updatedAt = useRegistrationStore((state) => state.updatedAt);
  const [tick, setTick] = useState(() => Date.now());
  const now = Math.max(tick, updatedAt) + offset;
  const summary = getRegistrationSummary(preview, now);

  useEffect(() => {
    const load = useRegistrationStore.getState().load;
    void load();
    const timer = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (summary.status !== "scheduled" && summary.status !== "open") return;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [summary.status]);

  return {
    preview,
    loaded,
    error,
    ...summary,
    // 아직 기간을 불러오지 못했으면 신청 가능 여부를 정하지 않습니다.
    canEnroll: loaded && summary.status === "open",
    closedMessage: loaded
      ? registrationClosedMessage(summary.status, preview)
      : "",
  };
}
