import { X, Heart, MapPin, UserRound, Clock3, BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import type { CourseListItem } from "../../shared/types/database";
import SyllabusLink from "../../shared/components/SyllabusLink";

type Props = {
  course: CourseListItem | null;
  isFavorite?: boolean;
  isSelected?: boolean;
  onClose: () => void;
  onToggleFavorite?: () => void;
  onToggleSelected?: () => void;
};

export default function CourseDetailModal({
  course,
  isFavorite = false,
  isSelected = false,
  onClose,
  onToggleFavorite,
  onToggleSelected,
}: Props) {
  if (!course) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#171821]/45 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-[650px] overflow-y-auto rounded-2xl border border-[#e3e4e9] bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#ececf0] bg-white px-6 py-5">
          <div className="pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#f0edff] px-2 py-1 text-[9px] font-bold text-[#7658e9]">
                {course.courseType ?? course.category}
              </span>
              <span className="text-[9px] text-[#999ca8]">
                {course.courseCode} · {course.sectionNo}분반
              </span>
            </div>
            <h2 className="mt-2 text-lg font-extrabold tracking-[-0.4px] text-[#20212b]">
              {course.title}
            </h2>
            <p className="mt-1 text-[10px] text-[#8c8f9c]">
              {course.majorName} · {course.professorName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#9699a7] hover:bg-[#f5f5f8] hover:text-[#30313b]"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 px-6 py-5 sm:grid-cols-3">
          <Info
            icon={<BookOpen size={15} />}
            label="학점"
            value={`${course.credit}학점`}
          />
          <Info
            icon={<UserRound size={15} />}
            label="대상 학년"
            value={`${course.targetGrade}학년`}
          />
          <Info
            icon={<MapPin size={15} />}
            label="수업 방식"
            value={course.isOnline ? "온라인" : "대면"}
          />
        </div>

        <div className="px-6 pb-5">
          <h3 className="text-xs font-bold text-[#30313b]">수업 일정</h3>
          <div className="mt-3 space-y-2">
            {course.isOnline ? (
              <div className="rounded-lg bg-[#fafafd] px-4 py-3 text-[10px] text-[#777985]">
                온라인 강의 · 시간표에는 별도 배치되지 않습니다.
              </div>
            ) : (
              course.schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between rounded-lg border border-[#ececf0] px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-[10px] font-semibold">
                    <Clock3 size={14} className="text-[#7658e9]" />
                    {schedule.dayOfWeek}요일 {schedule.startPeriod}~
                    {schedule.endPeriod}교시
                  </div>
                  <span className="text-[9px] text-[#858895]">
                    {schedule.classroom}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <section className="px-6 pb-5">
          <h3 className="text-xs font-bold text-[#30313b]">강의계획서</h3>
          <SyllabusLink courseId={course.id} />
        </section>

        <div className="border-t border-[#ececf0] bg-[#fafafd] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] text-[#9699a7]">수강 정원</p>
              <p className="mt-1 text-[10px] font-semibold text-[#454652]">
                현재 {course.enrolledCount ?? 0}명 / {course.capacity}명 · 잔여 {course.remainingSeats ?? Math.max(0, course.capacity - (course.enrolledCount ?? 0))}석
              </p>
            </div>
            <div className="flex gap-2">
              {onToggleFavorite && (
                <button
                  onClick={onToggleFavorite}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[9px] font-bold ${isFavorite ? "border-[#cfc7ff] bg-[#f0edff] text-[#7658e9]" : "border-[#dedfe5] bg-white text-[#777985]"}`}
                >
                  <Heart
                    size={13}
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                  {isFavorite ? "관심 해제" : "관심 저장"}
                </button>
              )}
              {onToggleSelected && (
                <button
                  onClick={onToggleSelected}
                  className={`rounded-lg px-4 py-2 text-[9px] font-bold ${isSelected ? "bg-[#ececf1] text-[#666976]" : "bg-[#7658e9] text-white"}`}
                >
                  {isSelected ? "시간표에서 제거" : "시간표에 추가"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#fafafd] p-3">
      <div className="flex items-center gap-1.5 text-[#7658e9]">
        {icon}
        <span className="text-[8px] font-semibold text-[#9699a7]">{label}</span>
      </div>
      <p className="mt-2 text-[11px] font-bold text-[#30313b]">{value}</p>
    </div>
  );
}
