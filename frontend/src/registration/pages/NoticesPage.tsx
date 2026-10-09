import { useMemo, useState } from "react";
import { Bell, ChevronRight, Pin, Search, X } from "lucide-react";

import { notices, type Notice } from "../../shared/data/notices";

export default function NoticesPage() {
  const [category, setCategory] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [active, setActive] = useState<Notice | null>(null);
  const filtered = useMemo(
    () =>
      notices.filter(
        (n) =>
          (category === "전체" || n.category === category) &&
          (!keyword.trim() ||
            `${n.title} ${n.body}`
              .toLowerCase()
              .includes(keyword.toLowerCase())),
      ),
    [category, keyword],
  );
  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
      <section className="overflow-hidden rounded-2xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
        <div className="border-b border-[#ececf0] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eee9ff] text-[#7658e9]">
              <Bell size={18} />
            </div>
            <div>
              <h1 className="text-sm font-extrabold">공지사항</h1>
              <p className="mt-1 text-[9px] text-[#9699a7]">
                수강신청과 학사 관련 주요 안내를 확인하세요.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b0]"
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="공지사항 검색"
                className="w-full rounded-lg border border-[#dddfe6] py-2 pl-9 pr-3 text-[9px] outline-none focus:border-[#a99aed]"
              />
            </div>
            {["전체", "수강신청", "학사", "장애안내", "일반"].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-lg border px-3 py-2 text-[9px] font-semibold ${category === c ? "border-[#7658e9] bg-[#7658e9] text-white" : "border-[#dedfe5] bg-white text-[#777985]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-[10px] text-[#9699a7]">
              검색 결과가 없습니다.
            </div>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => setActive(n)}
                className="group flex w-full items-center gap-3 border-b border-[#f0f0f3] px-5 py-4 text-left transition hover:bg-[#fafafd]"
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.important ? "bg-[#fff2f3] text-[#df6471]" : "bg-[#f4f4f7] text-[#858895]"}`}
                >
                  {n.important ? <Pin size={13} /> : <Bell size={13} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[#f4f3f8] px-2 py-1 text-[8px] font-semibold text-[#777985]">
                      {n.category}
                    </span>
                    {n.important && (
                      <span className="text-[8px] font-bold text-[#df6471]">
                        중요
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-[10px] font-bold text-[#30313b]">
                    {n.title}
                  </p>
                  <p className="mt-1 text-[8px] text-[#a0a3ae]">{n.date}</p>
                </div>
                <ChevronRight
                  size={15}
                  className="text-[#b1b2bb] transition group-hover:translate-x-0.5 group-hover:text-[#7658e9]"
                />
              </button>
            ))
          )}
        </div>
        <div className="px-5 py-3 text-[8px] text-[#a0a3ae]">
          총 {filtered.length}건 · 현재는 프론트 목업 공지이며 추후 백엔드
          게시판 API와 연결됩니다.
        </div>
      </section>
      {active && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#171821]/45 px-4"
          onMouseDown={() => setActive(null)}
        >
          <article
            className="w-full max-w-[620px] rounded-2xl bg-white shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#ececf0] px-6 py-5">
              <div>
                <div className="flex gap-2">
                  <span className="rounded-md bg-[#f0edff] px-2 py-1 text-[8px] font-bold text-[#7658e9]">
                    {active.category}
                  </span>
                  {active.important && (
                    <span className="rounded-md bg-[#fff1f2] px-2 py-1 text-[8px] font-bold text-[#df6471]">
                      중요 공지
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-base font-extrabold">
                  {active.title}
                </h2>
                <p className="mt-1 text-[8px] text-[#9a9daa]">{active.date}</p>
              </div>
              <button
                onClick={() => setActive(null)}
                className="rounded-lg p-2 text-[#9699a7] hover:bg-[#f5f5f8]"
              >
                <X size={17} />
              </button>
            </div>
            <div className="min-h-[180px] px-6 py-6 text-[10px] leading-7 text-[#656875]">
              {active.body}
            </div>
          </article>
        </div>
      )}
    </main>
  );
}
