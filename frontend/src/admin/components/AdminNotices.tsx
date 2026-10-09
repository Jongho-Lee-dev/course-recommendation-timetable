import { useState } from "react";
import { Bell, Pin, Plus, Search } from "lucide-react";
import { notices, type Notice } from "../../shared/data/notices";

const categories = ["수강신청", "학사", "장애안내", "일반"];
const inputClass =
  "w-full rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[11px] outline-none focus:border-[#a99aed]";
const buttonClass =
  "cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] disabled:cursor-not-allowed disabled:opacity-50";
const primaryClass = buttonClass + " !border-[#7658e9] !bg-[#7658e9] text-white";

export default function AdminNotices() {
  const [items, setItems] = useState<Notice[]>(notices);
  const [draft, setDraft] = useState<Notice | null>(null);
  const [adding, setAdding] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("전체");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const filtered = items.filter(
    (n) =>
      (category === "전체" || n.category === category) &&
      (n.title + " " + n.body)
        .toLowerCase()
        .includes(keyword.trim().toLowerCase()),
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#ececf0] pb-4">
        <div>
          <h2 className="!mb-1 !text-sm !font-bold">공지사항 관리</h2>
          <p className="text-[#858796]">
            수강신청·학사 안내의 제목, 내용과 중요 표시를 관리합니다.
          </p>
        </div>
        <button
          type="button"
          className={primaryClass + " flex items-center gap-2"}
          disabled={draft !== null}
          onClick={() => {
            setAdding(true);
            setError("");
            setMessage("");
            setDeletingId(null);
            setDraft({
              id: Math.max(0, ...items.map((n) => n.id)) + 1,
              category: "수강신청",
              title: "",
              body: "",
              important: false,
              date: new Intl.DateTimeFormat("sv-SE", {
                timeZone: "Asia/Seoul",
              })
                .format(new Date())
                .replaceAll("-", "."),
            });
          }}
        >
          <Plus size={14} />공지 추가
        </button>
      </div>
      {message && (
        <p role="status" className="mb-3 text-green-700">
          {message}
        </p>
      )}
      {draft && (
        <form
          className="mb-5 space-y-4 rounded-lg border border-[#e4e5eb] bg-[#fafafd] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.title.trim() || !draft.body.trim()) {
              setError("제목과 내용을 입력하세요.");
              return;
            }
            const saved = {
              ...draft,
              title: draft.title.trim(),
              body: draft.body.trim(),
            };
            setItems((prev) =>
              adding
                ? [saved, ...prev]
                : prev.map((n) => (n.id === saved.id ? saved : n)),
            );
            setDraft(null);
            setError("");
            setMessage(
              adding ? "공지사항을 추가했습니다." : "공지사항을 수정했습니다.",
            );
          }}
        >
          <h3 className="font-bold">
            {adding ? "공지사항 작성" : "공지사항 수정"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block font-semibold">분류</span>
              <select
                className={inputClass}
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="block font-semibold">작성일</span>
              <input
                type="date"
                required
                className={inputClass}
                value={draft.date.replaceAll(".", "-")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    date: e.target.value.replaceAll("-", "."),
                  })
                }
              />
            </label>
          </div>
          <label className="block space-y-2">
            <span className="block font-semibold">제목</span>
            <input
              autoFocus
              required
              maxLength={200}
              className={inputClass}
              placeholder="공지 제목을 입력하세요"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!draft.important}
              onChange={(e) =>
                setDraft({ ...draft, important: e.target.checked })
              }
            />중요 공지
          </label>
          <label className="block space-y-2">
            <span className="block font-semibold">내용</span>
            <textarea
              required
              rows={8}
              className={inputClass + " resize-y leading-6"}
              placeholder="수강신청 일정, 학사 안내 등 공지 내용을 입력하세요."
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </label>
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setDraft(null);
                setError("");
              }}
            >
              취소
            </button>
            <button type="submit" className={primaryClass}>
              저장
            </button>
          </div>
        </form>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            className="absolute left-3 top-2.5 text-[#9699a7]"
          />
          <input
            aria-label="공지사항 검색"
            placeholder="제목 또는 내용 검색"
            className={inputClass + " pl-9"}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
        {["전체", ...categories].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            className={category === c ? primaryClass : buttonClass}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-[#e4e5eb]">
        {filtered.map((n) => (
          <article
            key={n.id}
            className="border-b border-[#ececf0] p-4 last:border-b-0"
          >
            <div className="flex flex-wrap items-start gap-3">
              <span
                className={n.important ? "text-[#df6471]" : "text-[#858796]"}
              >
                {n.important ? <Pin size={16} /> : <Bell size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap gap-2 text-[10px] text-[#858796]">
                  <span className="rounded bg-[#f0edff] px-2 py-0.5 text-[#7658e9]">
                    {n.category}
                  </span>
                  {n.important && (
                    <strong className="text-[#df6471]">중요</strong>
                  )}
                  <span>{n.date}</span>
                </div>
                <h3 className="break-words font-bold">{n.title}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={draft !== null}
                  aria-label={n.title + " 수정"}
                  className={buttonClass}
                  onClick={() => {
                    setDraft({ ...n });
                    setAdding(false);
                    setError("");
                    setMessage("");
                    setDeletingId(null);
                  }}
                >
                  수정
                </button>
                <button
                  type="button"
                  disabled={draft !== null}
                  aria-label={n.title + " 삭제"}
                  className={buttonClass + " text-red-600"}
                  onClick={() => setDeletingId(n.id)}
                >
                  삭제
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words text-[11px] leading-6 text-[#656875]">
              {n.body}
            </p>
            {deletingId === n.id && (
              <div
                role="group"
                aria-label="공지 삭제 확인"
                className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-red-50 p-3"
              >
                <span className="mr-auto text-red-600">
                  이 공지사항을 삭제할까요?
                </span>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => setDeletingId(null)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={buttonClass + " text-red-600"}
                  onClick={() => {
                    setItems((prev) => prev.filter((item) => item.id !== n.id));
                    setDeletingId(null);
                    setMessage("공지사항을 삭제했습니다.");
                  }}
                >
                  삭제 확인
                </button>
              </div>
            )}
          </article>
        ))}
        {!filtered.length && (
          <p className="py-12 text-center text-[#858796]">
            {items.length
              ? "검색 결과가 없습니다."
              : "등록된 공지사항이 없습니다."}
          </p>
        )}
      </div>
      <p className="mt-3 text-[10px] text-[#858796]">
        총 {filtered.length}건 · 변경 사항은 관리자 화면에만 적용되며 새로고침하면 초기화됩니다.
      </p>
    </section>
  );
}
