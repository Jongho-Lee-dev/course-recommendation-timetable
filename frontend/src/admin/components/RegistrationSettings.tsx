import { useState } from "react";
import { CalendarClock, Clock3, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useRegistrationStore } from "../../shared/store/registrationStore";
import { useRegistrationStatus } from "../../shared/hooks/useRegistrationStatus";

const inputClass =
  "w-full min-w-0 rounded-md border border-[#dddfe6] bg-white px-3 py-2.5 text-[12px] text-[#5d6070] outline-none transition focus:border-[#a99aed] focus:ring-2 focus:ring-[#f0edff]";
const buttonClass =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-[11px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7658e9]";

function formatDate(value: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

export default function RegistrationSettings() {
  const [fields, setFields] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  const save = useRegistrationStore((state) => state.save);
  const stop = useRegistrationStore((state) => state.stop);
  const offset = useRegistrationStore((state) => state.offset);
  const {
    preview,
    status,
    statusLabel,
    remaining,
    remainingLabel,
    error: loadError,
  } = useRegistrationStatus();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>, done: string) => {
    setBusy(true);
    try {
      await action();
      setMessage(done);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const applyPreview = (immediate: boolean) => {
    setError("");
    setMessage("");
    // 이 컴퓨터 시계가 틀려도 서버 시간 기준으로 확인합니다.
    const currentTime = Date.now() + offset;
    if (
      !fields.endDate ||
      !fields.endTime ||
      (!immediate && (!fields.startDate || !fields.startTime))
    ) {
      setError(
        immediate
          ? "종료 날짜와 시간을 입력해주세요."
          : "시작과 종료 날짜·시간을 모두 입력해주세요.",
      );
      return;
    }

    const startsAt = immediate
      ? currentTime
      : Date.parse(`${fields.startDate}T${fields.startTime}:00+09:00`);
    const endsAt = Date.parse(`${fields.endDate}T${fields.endTime}:00+09:00`);
    if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
      setError("올바른 날짜와 시간을 입력해주세요.");
      return;
    }
    if (!immediate && startsAt <= currentTime) {
      setError(
        "예약 시작 시간은 현재보다 이후여야 합니다. 바로 시작하려면 ‘지금 시작’을 눌러주세요.",
      );
      return;
    }
    if (endsAt <= startsAt) {
      setError(
        immediate
          ? "종료 시간은 현재보다 이후여야 합니다."
          : "종료 시간은 시작 시간보다 이후여야 합니다.",
      );
      return;
    }
    void run(
      () => save(immediate ? null : startsAt, endsAt),
      immediate
        ? "수강신청을 지금 시작했습니다. 학생들이 바로 신청할 수 있습니다."
        : "수강신청 기간을 저장했습니다.",
    );
  };

  return (
    <section aria-labelledby="registration-settings-title">
      <div className="mb-5 flex items-start gap-3 border-b border-[#ececf0] pb-4">
        <div className="rounded-xl bg-[#f0edff] p-3 text-[#7658e9]">
          <CalendarClock size={22} aria-hidden="true" />
        </div>
        <div>
          <h2
            id="registration-settings-title"
            className="!mb-1 !text-sm !font-bold"
          >
            수강신청 설정
          </h2>
          <p className="text-[11px] leading-5 text-[#858796]">
            신청 기간을 예약하거나 지금 바로 시작할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-[#e7e1fb] bg-[#f7f5ff] px-4 py-3 text-[11px] leading-5 text-[#7967b0]">
        저장한 기간은 서버에 기록되어 모든 학생 화면에 반영됩니다. 학생은 이
        기간에만 수강신청과 취소를 할 수 있습니다.
        <Link
          to="/mainPage"
          className="ml-2 inline-block font-semibold underline underline-offset-2"
        >
          메인 화면에서 확인
        </Link>
      </div>

      <div className="mb-5 grid gap-3 min-[901px]:grid-cols-3">
        <div className="rounded-lg border border-[#e4e5eb] bg-[#fafafd] p-4">
          <span className="text-[10px] text-[#858796]">
            현재 상태
          </span>
          <div className="mt-2" role="status">
            <strong
              className={`inline-flex rounded-md px-2.5 py-1 text-xs ${status === "open" ? "bg-emerald-50 text-emerald-700" : status === "scheduled" ? "bg-[#f0edff] text-[#7658e9]" : "bg-[#ececf0] text-[#777985]"}`}
            >
              {statusLabel}
            </strong>
          </div>
        </div>
        <div className="rounded-lg border border-[#e4e5eb] bg-[#fafafd] p-4">
          <span className="text-[10px] text-[#858796]">{remainingLabel}</span>
          <strong className="mt-3 block text-sm tabular-nums text-[#454652]">
            {remaining}
          </strong>
        </div>
        <div className="rounded-lg border border-[#e4e5eb] bg-[#fafafd] p-4">
          <span className="text-[10px] text-[#858796]">
            적용된 신청 기간 · 한국 시간
          </span>
          <div className="mt-2 text-[11px] leading-5 text-[#5d6070]">
            {preview ? (
              <>
                <div>{formatDate(preview.startsAt)}</div>
                <div>~ {formatDate(preview.endsAt)}</div>
              </>
            ) : (
              "아직 설정된 기간이 없습니다."
            )}
          </div>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          applyPreview(false);
        }}
        className="rounded-xl border border-[#e4e5eb]"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ececf0] px-4 py-3">
          <strong className="text-xs">신청 기간 설정</strong>
          <span className="flex items-center gap-1 text-[10px] text-[#858796]">
            <Clock3 size={12} aria-hidden="true" />
            한국 시간 (UTC+9)
          </span>
        </div>
        <div className="grid gap-5 p-4 min-[901px]:grid-cols-2">
          {(
            [
              { prefix: "start", label: "수강신청 시작" },
              { prefix: "end", label: "수강신청 종료" },
            ] as const
          ).map(({ prefix, label }) => (
            <fieldset key={prefix} className="min-w-0">
              <legend className="mb-3 text-[11px] font-semibold text-[#5d6070]">
                {label}
              </legend>
              <div className="grid gap-3 min-[501px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                {(["Date", "Time"] as const).map((kind) => {
                  const key = `${prefix}${kind}` as keyof typeof fields;
                  return (
                    <label key={key} className="min-w-0">
                      <span className="mb-1.5 block text-[10px] text-[#858796]">
                        {kind === "Date" ? "날짜" : "시간"}
                      </span>
                      <input
                        aria-label={`${label} ${kind === "Date" ? "날짜" : "시간"}`}
                        className={inputClass}
                        type={kind === "Date" ? "date" : "time"}
                        value={fields[key]}
                        onChange={(event) => {
                          setFields({ ...fields, [key]: event.target.value });
                          setError("");
                          setMessage("");
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="px-4 pb-4">
          <p className="text-[10px] leading-5 text-[#858796]">
            ‘지금 시작’은 입력한 시작 시간 대신 현재 시간을 적용합니다. 종료
            시간은 반드시 입력해주세요.
          </p>
          {(error || loadError) && (
            <p role="alert" className="mt-3 text-[11px] text-red-600">
              {error || loadError}
            </p>
          )}
          <p role="status" className="mt-2 text-[11px] text-[#7658e9]">
            {message}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#ececf0] bg-[#fafafd] p-4">
          {(status === "scheduled" || status === "open") && (
            <button
              type="button"
              disabled={busy}
              className={`${buttonClass} mr-auto border-[#dddfe6] bg-white text-[#777985] hover:bg-[#f0edff] disabled:cursor-wait disabled:opacity-50`}
              onClick={() => {
                setError("");
                setMessage("");
                void run(
                  stop,
                  status === "open"
                    ? "수강신청을 종료했습니다."
                    : "예약을 취소했습니다.",
                );
              }}
            >
              {status === "scheduled" ? "예약 취소" : "종료하기"}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => applyPreview(true)}
            className={`${buttonClass} border-[#dddfe6] bg-white text-[#5d6070] hover:border-[#a99aed] hover:bg-[#f0edff] disabled:cursor-wait disabled:opacity-50`}
          >
            <Play size={14} aria-hidden="true" />
            지금 시작
          </button>
          <button
            type="submit"
            disabled={busy}
            className={`${buttonClass} border-[#7658e9] bg-[#7658e9] text-white hover:bg-[#6546d6] disabled:cursor-wait disabled:opacity-50`}
          >
            <CalendarClock size={14} aria-hidden="true" />
            {status === "scheduled" ? "예약 변경" : "예약하기"}
          </button>
        </div>
      </form>
    </section>
  );
}
