import { useState } from "react";
import { Building2, Plus, Sheet, Search } from "lucide-react";
import { api } from "../../shared/api";
import type { Department } from "../../shared/types/database";

const fields = [
  { key: "collegeName", label: "단과대학" },
  { key: "facultyName", label: "학부" },
  { key: "majorName", label: "학과" },
] as const;

export default function AdminDepartments({
  departments,
  onChange,
  loading,
  loadError,
  onRetry,
}: {
  departments: Department[];
  onChange: (items: Department[]) => void;
  loading: boolean;
  loadError: string;
  onRetry: () => void;
}) {
  const [mode, setMode] = useState<"list" | "add" | "edit" | "import">("list");
  const [draft, setDraft] = useState<Department | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Department[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const disabled = busy || loading || !!loadError;
  const fail = (e: unknown) =>
    setError(e instanceof Error ? e.message : "요청에 실패했습니다.");
  const changeMode = (next: typeof mode) => {
    setMode(next);
    setError("");
    setMessage("");
    setDraft(null);
    setPreview([]);
    setFile(null);
    if (next === "add")
      setDraft({
        id: Math.max(0, ...departments.map((d) => d.id)) + 1,
        majorName: "",
        collegeName: "",
        facultyName: "",
      });
  };
  const download = async () => {
    setBusy(true);
    setError("");
    try {
      const blob = await api<Blob>("/admin/departments.xlsx");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "학과_최신목록.xlsx";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };
  const filtered = departments.filter((d) =>
    [d.id, d.majorName, d.facultyName, d.collegeName]
      .join(" ")
      .includes(search.trim()),
  );
  const departmentForm = draft && (
    <form
      className="space-y-4 rounded-lg border border-[#e4e5eb] bg-[#fafafd] p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled) return;
        setBusy(true);
        setError("");
        setMessage("");
        try {
          const saved = await api<Department>(
            `/admin/departments${mode === "edit" ? `/${draft.id}` : ""}`,
            {
              method: mode === "edit" ? "PUT" : "POST",
              body: JSON.stringify({
                ...draft,
                majorName: draft.majorName.trim(),
                collegeName: draft.collegeName?.trim() || null,
                facultyName: draft.facultyName?.trim() || null,
              }),
            },
          );
          onChange(
            [...departments.filter((d) => d.id !== saved.id), saved].sort(
              (a, b) => a.id - b.id,
            ),
          );
          setDraft(null);
          setMode("list");
          setMessage(
            "학과를 DB에 저장했습니다. 최신 엑셀을 다운로드할 수 있습니다.",
          );
        } catch (e) {
          fail(e);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-4 min-[701px]:grid-cols-2">
        <label className="space-y-1.5 text-[#5d6070]">
          <span className="block font-semibold">학과코드</span>
          <input
            className="w-full min-w-0 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[11px] text-[#5d6070] outline-none focus:border-[#a99aed]"
            type="number"
            min="1"
            max="9007199254740991"
            step="1"
            required
            disabled={busy || mode === "edit"}
            value={draft.id}
            onChange={(e) => setDraft({ ...draft, id: Number(e.target.value) })}
          />
        </label>
        {fields.map(({ key, label }) => (
          <label key={key} className="space-y-1.5 text-[#5d6070]">
            <span className="block font-semibold">{label}</span>
            <input
              className="w-full min-w-0 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[11px] text-[#5d6070] outline-none focus:border-[#a99aed]"
              required={key === "majorName"}
              pattern={key === "majorName" ? ".*\\S.*" : undefined}
              maxLength={120}
              disabled={busy}
              value={draft[key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <p className="text-[#858796]">
        학과코드는 과목·학생 정보와 연결됩니다. 수정 시 코드는 유지됩니다.
      </p>
      <div className="flex justify-end gap-2">
        <button
          className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
          disabled={busy}
          type="button"
          onClick={() => (mode === "add" ? changeMode("list") : setDraft(null))}
        >
          취소
        </button>
        <button
          className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9] border-[#7658e9] bg-[#7658e9] text-white hover:bg-[#6546d6]"
          disabled={disabled}
          type="submit"
        >
          {busy ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </form>
  );
  if (mode === "list")
    return (
      <div>
        <h2 className="!mb-4 !text-sm !font-bold">학과 관리</h2>
        <div className="grid grid-cols-2 gap-3 min-[701px]:gap-4">
          {(
            [
              {
                mode: "add",
                title: "학과 추가",
                description: "새로운 단과대학, 학부, 학과를 등록합니다.",
                icon: Plus,
              },
              {
                mode: "edit",
                title: "학과 수정",
                description: "학과를 찾아 정보를 수정합니다.",
                icon: Building2,
              },
              {
                mode: "import",
                title: "엑셀 시트 적용",
                description: "엑셀 파일에 작성한 학과 정보를 적용합니다.",
                icon: Sheet,
              },
            ] as const
          ).map(({ mode: next, title, description, icon: Icon }) => (
            <button
              key={next}
              type="button"
              onClick={() => changeMode(next)}
              className="flex cursor-pointer flex-col items-start gap-3 rounded-xl border border-[#e3e4e9] bg-[#fafafd] p-4 text-left transition hover:border-[#a99aed] hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9] min-[701px]:p-7"
            >
              <span className="rounded-xl bg-[#f0edff] p-3 text-[#7658e9]">
                <Icon size={24} aria-hidden="true" />
              </span>
              <strong className="text-sm">{title}</strong>
              <span className="text-[11px] leading-5 text-[#858796]">
                {description}
              </span>
            </button>
          ))}
        </div>
        {message && (
          <p role="status" className="mt-4 text-green-700">
            {message}
          </p>
        )}
      </div>
    );
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#ececf0] pb-4">
        <h2 className="!mb-0 !text-sm !font-bold">
          {mode === "add"
            ? "학과 추가하기"
            : mode === "edit"
              ? "학과 수정하기"
              : "엑셀 파일 업로드"}
        </h2>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
          disabled={busy}
          onClick={() => changeMode("list")}
        >
          선택 화면으로
        </button>
      </div>
      {loading && <p role="status">학과를 불러오는 중입니다.</p>}
      {loadError && (
        <div role="alert" className="text-red-600">
          {loadError}{" "}
          <button
            className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
            onClick={onRetry}
          >
            다시 불러오기
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-600 whitespace-pre-wrap">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-green-700">
          {message}
        </p>
      )}
      {mode === "add" && departmentForm}

      {mode === "import" && (
        <div>
          <p className="mb-3">
            같은 코드는 수정하고 새 코드는 추가합니다. 파일에 없는 기존 학과는
            유지합니다.
          </p>
          <input
            aria-label="학과 엑셀 선택"
            type="file"
            accept=".xlsx"
            disabled={disabled}
            onChange={async (e) => {
              const selected = e.target.files?.[0];
              e.target.value = "";
              if (!selected) return;
              setFile(null);
              setPreview([]);
              setError("");
              setMessage("");
              if (selected.size > 5 * 1024 * 1024) {
                setError("5MB 이하의 엑셀만 업로드하세요.");
                return;
              }
              setBusy(true);
              try {
                const form = new FormData();
                form.append("file", selected);
                const rows = await api<Department[]>(
                  "/admin/departments-import?preview=true",
                  { method: "POST", body: form },
                );
                setPreview(rows);
                setFile(selected);
              } catch (err) {
                fail(err);
              } finally {
                setBusy(false);
              }
            }}
          />
          {file && (
            <p className="my-3 text-green-700">
              {file.name} · 검증 완료 {preview.length}개 (기존 수정{" "}
              {
                preview.filter((d) =>
                  departments.some((old) => old.id === d.id),
                ).length
              }
              개 / 신규{" "}
              {
                preview.filter(
                  (d) => !departments.some((old) => old.id === d.id),
                ).length
              }
              개)
            </p>
          )}
          {preview.length > 0 && (
            <div className="max-h-80 overflow-auto">
              <DepartmentTable rows={preview} />
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button
              className="cursor-pointer rounded-md bg-[#7658e9] px-4 py-2 font-semibold text-white hover:bg-[#6546d6] active:bg-[#5538bd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7658e9]"
              disabled={disabled || !file || !preview.length}
              onClick={async () => {
                if (!file) return;
                setBusy(true);
                setError("");
                try {
                  const form = new FormData();
                  form.append("file", file);
                  const updated = await api<Department[]>(
                    "/admin/departments-import",
                    { method: "POST", body: form },
                  );
                  onChange(updated);
                  setPreview([]);
                  setFile(null);
                  setMessage("엑셀의 학과 정보를 DB에 적용했습니다.");
                } catch (e) {
                  fail(e);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "처리 중…" : "엑셀 시트 적용하기"}
            </button>
          </div>
        </div>
      )}
      {mode === "edit" && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={14}
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858796]"
              />
              <input
                aria-label="학과 검색"
                className="w-full rounded-lg border border-[#dddfe6] py-2.5 pl-9 pr-3 text-[9px] outline-none focus:border-[#a99aed]"
                placeholder="학과코드, 단과대학, 학부, 학과 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
              onClick={() => setSearch("")}
            >
              초기화
            </button>
          </div>
          <p className="mb-3 text-[#858796]">총 {filtered.length}개 학과</p>
          {filtered.map((d) => (
            <div
              key={d.id}
              className="mb-3 overflow-hidden rounded-lg border border-[#dddfe6]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[#5d6070]">
                  <span>{d.id}</span>
                  <strong>{d.majorName}</strong>
                  <span>{d.collegeName}</span>
                  <span>{d.facultyName}</span>
                </div>
                <button
                  type="button"
                  className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
                  disabled={disabled}
                  onClick={() => {
                    setDraft(draft?.id === d.id ? null : { ...d });
                    setError("");
                    setMessage("");
                  }}
                >
                  {draft?.id === d.id ? "닫기" : "수정하기"}
                </button>
              </div>
              {draft?.id === d.id && departmentForm}
            </div>
          ))}
          {!loading &&
            !loadError &&
            departments.length > 0 &&
            filtered.length === 0 && (
              <p className="rounded-lg bg-[#fafafd] p-10 text-center text-[#858796]">
                검색 조건에 맞는 학과가 없습니다.
              </p>
            )}
          {!loading && !loadError && !departments.length && (
            <p>
              등록된 학과가 없습니다. 학과 추가 또는 엑셀 적용으로 등록하세요.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function DepartmentTable({
  rows,
  onEdit,
  disabled,
}: {
  rows: Department[];
  onEdit?: (d: Department) => void;
  disabled?: boolean;
}) {
  return (
    <table className="w-full min-w-[600px] text-left">
      <thead className="bg-[#fafafd]">
        <tr>
          {[
            "학과코드",
            "단과대학",
            "학부",
            "학과",
            ...(onEdit ? ["관리"] : []),
          ].map((h) => (
            <th key={h} className="border-b p-3">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <tr key={d.id}>
            <td className="border-b p-3">{d.id}</td>
            {fields.map((f) => (
              <td key={f.key} className="border-b p-3">
                {d[f.key] || "—"}
              </td>
            ))}
            {onEdit && (
              <td className="border-b p-3">
                <button
                  className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
                  disabled={disabled}
                  onClick={() => onEdit(d)}
                >
                  수정
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
