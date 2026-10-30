import { useState } from "react";
import { Building2, Plus, Sheet, Search } from "lucide-react";
import {
  downloadDepartmentExcel,
  readDepartmentExcel,
  saveDepartmentExcel,
} from "../utils/departmentExcel";
import type { Department } from "../../shared/types/database";

const fields = [
  { key: "collegeName", label: "단과대학" },
  { key: "facultyName", label: "학부" },
  { key: "majorName", label: "학과" },
] as const;

export default function AdminDepartments({
  departments,
  onChange,
}: {
  departments: Department[];
  onChange: (items: Department[]) => void;
}) {
  const [mode, setMode] = useState<"list" | "add" | "edit" | "import">("list");
  const [draft, setDraft] = useState<Department | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Department[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [excelHandle, setExcelHandle] = useState<FileSystemFileHandle | null>(
    null,
  );
  const disabled = busy;
  const selectExcel = async () => {
    if (!("showOpenFilePicker" in window)) {
      setError(
        "엑셀 직접 저장은 데스크톱 Chrome 또는 Edge에서 사용하세요. 엑셀 불러오기와 다운로드는 다른 브라우저에서도 가능합니다.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const [handle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "학과 엑셀",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"],
            },
          },
        ],
      });
      const items = await readDepartmentExcel(await handle.getFile());
      setExcelHandle(handle);
      onChange(items);
      if (mode === "add")
        setDraft({
          id: Math.max(0, ...items.map((d) => d.id)) + 1,
          majorName: "",
          collegeName: "",
          facultyName: "",
        });
      else setDraft(null);
      setMessage(`${handle.name}을 불러왔습니다.`);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) fail(e);
    } finally {
      setBusy(false);
    }
  };
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
      downloadDepartmentExcel(departments);
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
          if (!excelHandle)
            throw new Error(
              "위의 ‘저장할 엑셀 선택’ 버튼으로 파일을 먼저 선택하세요.",
            );
          const updated = await saveDepartmentExcel(
            excelHandle,
            draft,
            mode === "edit",
          );
          onChange(updated);
          setDraft(null);
          setMode("list");
          setMessage("선택한 엑셀 파일에 학과 정보를 저장했습니다.");
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
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {mode !== "import" && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={selectExcel}
              className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
            >
              저장할 엑셀 선택
            </button>
            <span>{excelHandle?.name ?? "선택된 파일 없음"}</span>
          </>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={download}
          className="cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]"
        >
          학과 엑셀 다운로드
        </button>
      </div>
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
            엑셀 파일의 학과 목록을 현재 화면에 불러옵니다. 추가·수정하려면 해당
            화면에서 저장할 엑셀을 선택하세요.
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
                const rows = await readDepartmentExcel(selected);
                if (!rows.length) throw new Error("적용할 학과가 없습니다.");
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
                  onChange(preview);
                  setExcelHandle(null);
                  setPreview([]);
                  setFile(null);
                  setMessage("엑셀의 학과 목록을 화면에 적용했습니다.");
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
          {departments.length > 0 && filtered.length === 0 && (
            <p className="rounded-lg bg-[#fafafd] p-10 text-center text-[#858796]">
              검색 조건에 맞는 학과가 없습니다.
            </p>
          )}
          {!departments.length && (
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
