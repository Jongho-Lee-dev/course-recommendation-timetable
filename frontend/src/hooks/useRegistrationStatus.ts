import { useEffect, useState } from "react";
import { getRegistrationSummary, useRegistrationStore } from "../store/registrationStore";

export function useRegistrationStatus() {
  const preview = useRegistrationStore((state) => state.preview);
  const updatedAt = useRegistrationStore((state) => state.updatedAt);
  const [tick, setTick] = useState(() => Date.now());
  const summary = getRegistrationSummary(preview, Math.max(tick, updatedAt));

  useEffect(() => {
    if (summary.status !== "scheduled" && summary.status !== "open") return;
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [summary.status]);

  return { preview, ...summary };
}
