import { useEffect, useRef, useState } from "react";
import { ArrowDown, Bot, BookOpen, CalendarDays, CircleHelp, MessageCircle, Plus, Send, Sparkles, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { api } from "../../shared/api";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string; time: string };
const suggestions = ["시간표 짤 때 고려할 점 알려줘", "전공 과목을 찾고 싶어", "내 학점 기준으로 계획 세우기", "시간표 추천 기능 안내"];
function nowTime() { return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date()); }
function renderText(text: string) { return text.split("**").map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>); }

export default function ChatbotPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{ id: 1, role: "assistant", text: `안녕하세요, ${user?.name ?? "학생"}님! 👋\n수강 신청과 시간표 계획을 도와드리는 AI 학업 도우미예요.\n\n아래 추천 질문을 선택하거나 궁금한 내용을 입력해 주세요.`, time: nowTime() }]);
  const messagesRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(2);
  useEffect(() => {
    const list = messagesRef.current;
    list?.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages]);
  const send = async (value = input) => {
    const text = value.trim();
    if (!text || busy) return;
    const userMessage: ChatMessage = { id: nextId.current++, role: "user", text, time: nowTime() };
    const history = [...messages, userMessage].filter((message) => message.id !== 1).slice(-12);
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setBusy(true);
    try {
      const result = await api<{ reply: string }>("/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: history.map(({ role, text: content }) => ({ role, text: content })),
          student: {
            name: user?.name ?? "학생",
            major: user?.major ?? null,
            grade: user?.grade ?? null,
            completedCredits: user?.completedCredits ?? null,
            maxCredits: user?.maxCredits ?? null,
          },
        }),
      }, "student");
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: result.reply, time: nowTime() }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "답변을 가져오지 못했어요.";
      setMessages((current) => [...current, { id: nextId.current++, role: "assistant", text: `답변을 가져오지 못했어요. ${message}`, time: nowTime() }]);
    } finally {
      setBusy(false);
    }
  };
  const reset = () => { setMessages([{ id: nextId.current++, role: "assistant", text: `대화를 새로 시작할게요, ${user?.name ?? "학생"}님! 어떤 도움이 필요하신가요?`, time: nowTime() }]); setInput(""); };

  return (
    <main className="mx-auto flex w-full max-w-[1250px] shrink-0 flex-col lg:h-full lg:min-h-[420px] px-3 py-5 text-[#28283a] sm:px-6 sm:py-7">
      <div className="mb-5 flex shrink-0 flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#8a76f0] to-[#6553d8] text-white shadow-md shadow-[#7560e8]/20"><Sparkles size={22}/></div><div><p className="text-[10px] font-extrabold tracking-[.15em] text-[#8372e8]">ACADEMIC ASSISTANT</p><h1 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">AI 학업 도우미</h1><p className="mt-1 text-xs text-[#898b9a]">수강 신청과 시간표 계획을 편하게 물어보세요.</p></div></div><button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-[#e5e5ee] bg-white px-3.5 py-2.5 text-xs font-bold text-[#666879] transition hover:border-[#d7d0ff] hover:text-[#6c58dc]"><Trash2 size={14}/>새 대화</button></div>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:grid-rows-[minmax(0,1fr)]">
        <section className="flex h-[clamp(320px,65dvh,640px)] min-h-0 min-w-0 flex-col overflow-hidden lg:h-auto rounded-2xl border border-[#e5e6ee] bg-white shadow-[0_5px_24px_rgba(24,26,44,.035)]">
          <header className="flex shrink-0 items-center justify-between border-b border-[#f0f0f4] px-4 py-3.5 sm:px-5"><div className="flex items-center gap-3"><div className="relative grid h-9 w-9 place-items-center rounded-xl bg-[#f0edff] text-[#7560e8]"><Bot size={19}/><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#43c99a]"/></div><div><p className="text-xs font-extrabold">시간표 AI 어시스턴트</p><p className="mt-1 text-[10px] text-[#8b8d9b]">학업 계획 · 강의 검색 · 시간표 안내</p></div></div><span className="rounded-full bg-[#edfbf5] px-2.5 py-1 text-[9px] font-bold text-[#27956d]">Gemini AI 연결</span></header>
          <div ref={messagesRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-[#fbfbfd] p-4 sm:p-6">
            {messages.map((message) => <div key={message.id} className={`flex items-start gap-2.5 ${message.role === "user" ? "flex-row-reverse" : ""}`}><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${message.role === "assistant" ? "bg-[#eeeaff] text-[#7560e8]" : "bg-[#e8f2ff] text-[#4076c8]"}`}>{message.role === "assistant" ? <Bot size={16}/> : <UserRound size={16}/>}</div><div className={`max-w-[88%] sm:max-w-[78%] ${message.role === "user" ? "text-right" : ""}`}><div className={`inline-block break-words whitespace-pre-wrap rounded-2xl px-4 py-3 text-[13px] leading-6 ${message.role === "assistant" ? "rounded-tl-md border border-[#e9e9f1] bg-white text-[#454657]" : "rounded-tr-md bg-[#7560e8] text-white"}`}>{message.role === "assistant" ? renderText(message.text) : message.text}</div><p className={`mt-1.5 text-[9px] text-[#a0a2ae] ${message.role === "user" ? "mr-1" : "ml-1"}`}>{message.time}</p></div></div>)}
            {messages.length <= 1 && <div className="ml-10"><p className="mb-2 text-[10px] font-bold text-[#898b9a]">이런 질문은 어떠세요?</p><div className="flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-xl border border-[#e5e1ff] bg-white px-3 py-2 text-left text-[11px] font-semibold text-[#6d5bd2] transition hover:bg-[#f4f1ff]">{s}</button>)}</div></div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void send(); }} className="shrink-0 border-t border-[#eeeeF4] bg-white p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-[#e5e5ee] bg-[#fbfbfd] p-2 focus-within:border-[#a69aef] focus-within:ring-4 focus-within:ring-[#8a76f0]/10"><textarea value={input} disabled={busy} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} rows={1} placeholder={busy ? "Gemini가 답변을 작성하고 있어요…" : "궁금한 내용을 입력하세요… (Enter 전송, Shift+Enter 줄바꿈)"} className="max-h-28 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-xs leading-5 outline-none placeholder:text-[#a0a2ae]"/><button type="submit" disabled={!input.trim() || busy} aria-label="메시지 보내기" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#7560e8] text-white transition hover:bg-[#6650d8] disabled:cursor-not-allowed disabled:bg-[#d6d1f7]"><Send size={16}/></button></div><p className="mt-2 text-center text-[9px] text-[#a0a2ae]">Gemini가 답변합니다. 실제 개설 과목과 졸업 요건은 사이트 강의검색 및 학교 공식 안내에서 확인하세요.</p></form>
        </section>
        <aside className="min-h-0 space-y-4 lg:overflow-y-auto lg:overscroll-contain"><section className="rounded-2xl border border-[#e5e6ee] bg-white p-5"><div className="flex items-center gap-2 text-sm font-extrabold"><CircleHelp size={17} className="text-[#7560e8]"/>빠른 도움말</div><div className="mt-4 space-y-2">{[{icon:BookOpen,title:"강의 검색",desc:"전공·교양 과목 찾아보기",to:"/courses"},{icon:CalendarDays,title:"시간표 필터",desc:"조건별 시간표 후보 만들기",to:"/ai"},{icon:MessageCircle,title:"내 정보 수정",desc:"학년·학점 정보 관리",to:"/profile"}].map(({icon:Icon,title,desc,to}) => <button key={to} type="button" onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-[#e9e5ff] hover:bg-[#faf9ff]"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f1efff] text-[#7560e8]"><Icon size={16}/></span><span className="min-w-0 flex-1"><strong className="block text-xs">{title}</strong><small className="mt-1 block text-[10px] text-[#9092a0]">{desc}</small></span><ArrowDown className="-rotate-45 text-[#a2a3af]" size={14}/></button>)}</div></section><section className="rounded-2xl border border-[#e5e6ee] bg-gradient-to-br from-[#f7f5ff] to-white p-5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#7560e8] shadow-sm"><Sparkles size={17}/></div><h2 className="mt-3 text-sm font-extrabold">더 정확한 시간표를 위해</h2><p className="mt-2 text-[11px] leading-5 text-[#77798a]">이수 학점과 최대 신청 학점은 내 정보에서 확인하고, 추천 페이지에서 원하는 조건을 설정해 보세요.</p><button type="button" onClick={() => navigate("/profile")} className="mt-4 w-full rounded-xl bg-[#7560e8] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#6650d8]">내 정보 확인하기</button></section><div className="flex items-start gap-2 rounded-xl bg-[#f0f1f6] p-3 text-[10px] leading-5 text-[#858797]"><Plus size={13} className="mt-0.5 shrink-0"/>현재 대화는 Gemini AI가 답변하며, 과목 데이터는 임의로 만들어내지 않습니다.</div></aside>
      </div>
    </main>
  );
}
