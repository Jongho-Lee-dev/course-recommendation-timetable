import type { CourseListItem } from "../../types/database";

type WeeklyTimetableProps = {
  selected: CourseListItem[];
};

const days = ["월", "화", "수", "목", "금"];

const periods = Array.from({ length: 10 }, (_, i) => i + 1);

export default function WeeklyTimetable({ selected }: WeeklyTimetableProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)] min-[1101px]:order-none">
      <div className="flex items-center justify-between border-b border-[#ececf0] px-5 py-4">
        <div>
          <h2 className="text-sm font-bold">주간 시간표</h2>

          <p className="mt-1 text-[9px] text-[#9699a7]">
            현재 신청한 강좌를 기준으로 표시됩니다.
          </p>
        </div>

        <button
          type="button"
          className="rounded-md border border-[#dedfe5] bg-white px-2 py-1.5 text-[9px] text-[#777a89]"
        >
          주간 새로고침
        </button>
      </div>

      <div className="flex h-[508px] min-w-[540px]">
        <div className="w-[49px] shrink-0 text-right text-[8px] text-[#a0a3b0]">
          <div className="h-[37px] border-b border-[#e8e9ee]" />

          {periods.map((period) => (
            <div
              className="box-border h-[47px] border-b border-[#f1f1f4] pr-1.5 pt-1.5"
              key={period}
            >
              {period}교시
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid h-[37px] grid-cols-5 border-b border-[#e8e9ee]">
            {days.map((day) => (
              <div
                className="grid place-items-center border-l border-[#ececf0] text-[9px] font-bold text-[#777a89]"
                key={day}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid h-[470px] grid-cols-5">
            {days.map((day) => (
              <div
                className="relative border-l border-[#ececf0] bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_46px,#eff0f3_46px,#eff0f3_47px)]"
                key={day}
              >
                {periods.map((period) => (
                  <div className="h-[47px]" key={period} />
                ))}

                {selected.flatMap((course) =>
                  course.schedules
                    .filter((schedule) => schedule.dayOfWeek === day)
                    .map((schedule) => (
                      <div
                        className="absolute left-[3px] right-[3px] overflow-hidden rounded-md border-l-[3px] border-[#7658e9] bg-[#eee9ff] p-1.5"
                        key={`${course.id}-${schedule.id}`}
                        style={{
                          top: `${(schedule.startPeriod - 1) * 48 + 1}px`,
                          height: `${(schedule.endPeriod -
                            schedule.startPeriod +
                            1) *
                            48 -
                            2
                            }px`,
                        }}
                      >
                        <b className="block text-[7px] text-[#7658e9]">
                          {course.courseCode}
                        </b>

                        <strong className="mt-0.5 block text-[9px]">
                          {course.title}
                        </strong>

                        <small className="mt-1 block text-[7px] text-[#858895]">
                          {course.professorName}
                        </small>
                      </div>
                    )),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}