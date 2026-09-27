import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, BookOpen, CalendarDays, Heart, ClipboardList, Sparkles } from "lucide-react";

const config = {
  courses: {
    title: "강의검색",
    description: "전공과 교양 강의를 검색하고 수강할 과목을 선택할 수 있습니다.",
    icon: BookOpen,
    accent: "강의 목록은 현재 프로젝트의 목업 데이터를 기준으로 표시됩니다.",
  },
  timetable: {
    title: "나의 시간표",
    description: "선택한 강의를 한눈에 확인하고 주간 시간표를 관리합니다.",
    icon: CalendarDays,
    accent: "시간표 데이터는 현재 선택된 강좌와 연결할 수 있도록 구성되어 있습니다.",
  },
  ai: {
    title: "AI 시간표 추천",
    description: "AI가 강의 선택 조건을 분석해 최적의 시간표를 추천하는 공간입니다.",
    icon: Sparkles,
    accent: "AI 추천 로직은 보류 상태이며, 화면과 이동 경로만 먼저 구성했습니다.",
  },
  favorites: {
    title: "관심강좌",
    description: "관심 있는 강의를 저장하고 수강신청 전에 다시 확인할 수 있습니다.",
    icon: Heart,
    accent: "관심강좌 저장 기능은 이후 백엔드와 연결할 수 있도록 화면을 먼저 구성했습니다.",
  },
  history: {
    title: "신청내역",
    description: "현재 신청했거나 신청했던 강좌를 확인하는 공간입니다.",
    icon: ClipboardList,
    accent: "신청내역은 추후 실제 수강신청 API와 연결할 수 있습니다.",
  },
  notices: {
    title: "공지사항",
    description: "수강신청과 관련된 공지 및 주요 안내를 확인할 수 있습니다.",
    icon: Bell,
    accent: "공지사항 게시판은 추후 서버 데이터와 연결할 수 있도록 구성했습니다.",
  },
} as const;

type FeatureKey = keyof typeof config;

const cards: Record<FeatureKey, { title: string; text: string; href: string }> = {
  courses: { title: "강의검색으로 이동", text: "강의 목록을 확인합니다.", href: "/courses" },
  timetable: { title: "나의 시간표로 이동", text: "선택한 과목의 시간표를 확인합니다.", href: "/timetable" },
  ai: { title: "AI 추천 준비", text: "추천 화면은 구현을 보류하고 이동만 연결했습니다.", href: "/ai" },
  favorites: { title: "관심강좌 확인", text: "저장한 강의를 확인합니다.", href: "/favorites" },
  history: { title: "신청내역 확인", text: "수강신청 내역을 확인합니다.", href: "/history" },
  notices: { title: "공지사항 확인", text: "최근 안내를 확인합니다.", href: "/notices" },
};

export default function FeaturePage({ type }: { type: FeatureKey }) {
  const item = config[type];
  const Icon = item.icon;
  const card = cards[type];

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#f5f6f9] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-2xl border border-[#e3e4e9] bg-white p-6 shadow-[0_3px_14px_rgba(26,28,44,0.035)] min-[801px]:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#f0edff] text-[#7658e9]">
              <Icon size={23} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-[-0.5px]">{item.title}</h1>
              <p className="mt-1 text-xs leading-6 text-[#777985]">{item.description}</p>
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-dashed border-[#d9d9e2] bg-[#fafafd] p-5">
            <p className="text-xs font-semibold text-[#454652]">현재 상태</p>
            <p className="mt-2 text-[11px] leading-6 text-[#858796]">{item.accent}</p>
          </div>

          <div className="mt-5 grid gap-3 min-[701px]:grid-cols-2">
            <InfoCard title={card.title} text={card.text} href={card.href} />
            {type !== "ai" && (
              <InfoCard
                title="대시보드로 돌아가기"
                text="메인 화면에서 강의 선택과 시간표를 확인합니다."
                href="/mainPage"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Link
      to={href}
      className="group flex items-center justify-between rounded-xl border border-[#e5e5eb] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#cfc8ff] hover:shadow-sm"
    >
      <div>
        <p className="text-xs font-bold text-[#30313b]">{title}</p>
        <p className="mt-1 text-[10px] text-[#92949f]">{text}</p>
      </div>
      <ArrowRight size={16} className="text-[#a0a1aa] transition group-hover:translate-x-1 group-hover:text-[#7658e9]" />
    </Link>
  );
}
