import type { CourseListItem } from "../../types/database";

type CourseRegistrationListProps = {
  selected: CourseListItem[];
  totalCredits: number;
};

export default function CourseRegistrationList({
  selected,
  totalCredits,
}: CourseRegistrationListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]">
      <div className="flex items-center justify-between border-b border-[#ececf0] px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold">
            수강 신청 목록
          </h2>

          <p className="mt-1 text-[9px] text-[#9699a7]">
            현재 선택한 강좌입니다.
          </p>
        </div>

        <strong className="text-[9px] text-[#7658e9]">
          신청 총 학점: {totalCredits}학점
        </strong>
      </div>

      <div className="grid grid-cols-1 gap-1.5 px-5 py-2 min-[701px]:grid-cols-2">
        {selected.map((course) => (
          <div
            className="relative rounded-md border border-[#ececf1] px-2.5 py-2"
            key={course.id}
          >
            <span className="block text-[10px] font-bold">
              {course.title}
            </span>

            <small className="mt-0.5 block text-[8px] text-[#9699a7]">
              {course.courseCode} · {course.professorName}
            </small>

            <b className="absolute right-2 top-2.5 text-[8px] text-[#7658e9]">
              {course.credit}학점
            </b>
          </div>
        ))}
      </div>
    </div>
  );
}