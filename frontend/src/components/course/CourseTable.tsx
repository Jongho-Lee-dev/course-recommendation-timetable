import type { CourseListItem } from "../../types/database";
import { toast } from "sonner";

interface CourseTableProps {
  courses: CourseListItem[];
  selected: CourseListItem[];
  toggleCourse: (course: CourseListItem) => void;
}

export default function CourseTable({
  courses,
  selected,
  toggleCourse,
}: CourseTableProps) {
  const handleToggleCourse = (course: CourseListItem) => {
    const isSelected = selected.some((item) => item.id === course.id);

    if (isSelected) {
      toggleCourse(course);
      return;
    }

    const conflictCourse = selected.find((selectedCourse) =>
      selectedCourse.schedules.some((selectedSchedule) =>
        course.schedules.some(
          (schedule) =>
            selectedSchedule.dayOfWeek === schedule.dayOfWeek &&
            selectedSchedule.startPeriod <= schedule.endPeriod &&
            selectedSchedule.endPeriod >= schedule.startPeriod,
        ),
      ),
    );

    if (conflictCourse) {
      toast.error(`'${conflictCourse.title}' 강의와 시간이 겹칩니다.`);
      return;
    }

    toggleCourse(course);
  }

  return (
    <div className="overflow-x-auto border-t border-[#ececf0]">
      <div className="grid min-w-[600px] grid-cols-[1.45fr_0.8fr_1.15fr_0.42fr_0.65fr_44px] items-center gap-2 bg-[#fafafd] px-5 py-2.5 text-[8px] text-[#9a9daa]">
        <span>강좌명</span>
        <span>교수명</span>
        <span>요일/시간/강의실</span>
        <span>학점</span>
        <span>정원</span>
        <span>신청</span>
      </div>

      {courses.map((course) => {
        const isSelected = selected.some((item) => item.id === course.id);

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
            className={`grid min-h-[47px] min-w-[600px] grid-cols-[1.45fr_0.8fr_1.15fr_0.42fr_0.65fr_44px] items-center gap-2 border-t border-[#f0f0f3] px-5 py-2 text-[9px] transition hover:bg-[#fafafd] ${isSelected ? "bg-[#faf8ff]" : ""
              }`}
            key={course.id}
          >
            <div>
              <b className="block text-[10px]">{course.title}</b>
              <small className="mt-1 block text-[8px] text-[#9b9eab]">
                {course.courseCode} · {course.category}
              </small>
            </div>

            <span>{course.professorName}</span>
            <span>{scheduleText}</span>
            <span>{course.credit} cr</span>

            <span className="text-[#8b8e9c]">
              {isSelected ? "신청완료" : `18/${course.capacity}`}
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
          </div>
        );
      })}
    </div>
  );
}