import { useUserStore } from "../../store/userStore";
import type { CourseListItem } from "../../types/database";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { findConflict, getTotalCredits } from "../../utils/courseRules";

interface CourseTableProps {
  courses: CourseListItem[];
  selected: CourseListItem[];
  toggleCourse: (course: CourseListItem) => void;
  favorites?: CourseListItem[];
  toggleFavorite?: (course: CourseListItem) => void;
  onCourseClick?: (course: CourseListItem) => void;
}

export default function CourseTable({
  courses,
  selected,
  toggleCourse,
  favorites = [],
  toggleFavorite,
  onCourseClick,
}: CourseTableProps) {
  const user = useUserStore((state) => state.user);

  const handleToggleCourse = (course: CourseListItem) => {
    const isSelected = selected.some(
      (item) => item.id === course.id,
    );

    if (isSelected) {
      toggleCourse(course);
      return;
    }

    const conflictCourse = selected.find((selectedCourse) => findConflict(selectedCourse, course));

    if (conflictCourse) {
      const conflict = findConflict(conflictCourse, course);
      toast.error(
        `'${conflictCourse.title}'와 ${conflict ? `${conflict.detail.day} ${conflict.detail.firstTime}` : "시간"}이 겹칩니다.`,
      );
      return;
    }

    const totalCredits = getTotalCredits(selected);

    if (totalCredits + course.credit > (user?.maxCredits ?? 18)) {
      const exceededCredits = totalCredits + course.credit - (user?.maxCredits ?? 18);
      toast.error(
        `'${course.title}' 추가 시 ${exceededCredits}학점 초과합니다. (최대 ${user?.maxCredits ?? 18}학점)`,
      );
      return;
    }

    toggleCourse(course);
  };

  return (
    <div className="overflow-x-auto border-t border-[#ececf0]">
      <div className="grid min-w-[640px] grid-cols-[1.35fr_0.75fr_1.1fr_0.42fr_0.65fr_44px_36px] items-center gap-2 bg-[#fafafd] px-5 py-2.5 text-[8px] text-[#9a9daa]">
        <span>강좌명</span>
        <span>교수명</span>
        <span>요일/시간/강의실</span>
        <span>학점</span>
        <span>정원</span>
        <span>신청</span>
        <span>관심</span>
      </div>

      <div className="max-h-[470px] overflow-y-auto">
        {courses.map((course) => {
          const isSelected = selected.some(
            (item) => item.id === course.id,
          );

          const scheduleText = course.isOnline
            ? "온라인 강의"
            : course.schedules
              .map(
                (schedule) =>
                  `${schedule.dayOfWeek} ${schedule.startPeriod}~${schedule.endPeriod}교시 (${schedule.classroom})`,
              )
              .join(", ");
          return (
            <div
              className={`grid min-h-[47px] min-w-[640px] grid-cols-[1.35fr_0.75fr_1.1fr_0.42fr_0.65fr_44px_36px] items-center gap-2 border-t border-[#f0f0f3] px-5 py-2 text-[9px] transition hover:bg-[#fafafd] ${isSelected ? "bg-[#faf8ff]" : ""
                }`}
              key={course.id}
            >
              <div>
                <button type="button" onClick={() => onCourseClick?.(course)} className="block text-left text-[10px] font-bold hover:text-[#7658e9]">
                  {course.title}
                </button>
                <small className="mt-1 block text-[8px] text-[#9b9eab]">
                  {course.courseCode} · {course.courseType ?? course.category}
                </small>
              </div>
              <span>{course.professorName}</span>
              <span>{scheduleText}</span>
              <span>{course.credit} cr</span>
              <span className="text-[#8b8e9c]">
                {isSelected
                  ? "신청완료"
                  : `18/${course.capacity}`}
              </span>

              <button
                className={`rounded-md px-1.5 py-1.5 text-[8px] ${isSelected
                  ? "bg-[#f0eff6] text-[#777a88]"
                  : "bg-[#7658e9] text-white"
                  }`}
                onClick={() => handleToggleCourse(course)}
              >
                {isSelected ? "취소" : "신청"}
              </button>

              {toggleFavorite ? (
                <button
                  type="button"
                  aria-label={`${course.title} 관심강좌`}
                  onClick={() => toggleFavorite(course)}
                  className={`grid h-7 w-7 place-items-center rounded-md transition ${favorites.some((item) => item.id === course.id)
                    ? "bg-[#eee9ff] text-[#7658e9]"
                    : "bg-[#f5f5f8] text-[#a0a2ad] hover:text-[#7658e9]"
                    }`}
                >
                  <Heart size={12} fill={favorites.some((item) => item.id === course.id) ? "currentColor" : "none"} />
                </button>
              ) : <span />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
