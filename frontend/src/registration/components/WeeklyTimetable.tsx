import type { CourseListItem } from "../../shared/types/database";

type WeeklyTimetableProps = {
  selected: CourseListItem[];
};

const days = ["월", "화", "수", "목", "금"];

const periods = Array.from({ length: 10 }, (_, i) => i + 1);

// 강좌마다 다른 색을 씁니다. 같은 강좌는 요일이 달라도 같은 색입니다.
const palette = [
  { bg: "#eee9ff", border: "#7658e9", text: "#7658e9" }, // 보라
  { bg: "#e3f0ff", border: "#3b82c4", text: "#2f6fa8" }, // 파랑
  { bg: "#e2f4ea", border: "#2f9e6a", text: "#23805a" }, // 초록
  { bg: "#fff0db", border: "#e08a1e", text: "#b0670c" }, // 주황
  { bg: "#ffe6ea", border: "#d9506a", text: "#b83a52" }, // 분홍
  { bg: "#dff4f4", border: "#2a9d9d", text: "#1f7f7f" }, // 청록
  { bg: "#f1f5d8", border: "#8fa424", text: "#667812" }, // 연두
  { bg: "#f3e6fb", border: "#a052c9", text: "#8640ad" }, // 자주
];

export default function WeeklyTimetable({ selected }: WeeklyTimetableProps) {
  // 담은 순서대로 색을 정해서, 8과목까지는 모두 다른 색이 됩니다.
  const colorOf = new Map(
    selected.map((course, index) => [
      course.id,
      palette[index % palette.length],
    ]),
  );
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

                {selected.flatMap((course) => {
                  const color = colorOf.get(course.id) ?? palette[0];
                  return course.schedules
                    .filter((schedule) => schedule.dayOfWeek === day)
                    .map((schedule) => (
                      <div
                        className="absolute left-[3px] right-[3px] overflow-hidden rounded-md border-l-[3px] p-1.5"
                        key={`${course.id}-${schedule.id}`}
                        style={{
                          backgroundColor: color.bg,
                          borderLeftColor: color.border,
                          top: `${(schedule.startPeriod - 1) * 48 + 1}px`,
                          height: `${
                            (schedule.endPeriod - schedule.startPeriod + 1) *
                              48 -
                            2
                          }px`,
                        }}
                      >
                        <b
                          className="block text-[7px]"
                          style={{ color: color.text }}
                        >
                          {course.courseCode}
                        </b>

                        <strong className="mt-0.5 block text-[9px]">
                          {course.title}
                        </strong>

                        <small className="mt-1 block text-[7px] text-[#858895]">
                          {course.professorName}
                        </small>
                      </div>
                    ));
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {selected.some((course) => course.isOnline) && (
        <div className="border-t border-[#ececf0] px-5 py-4">
          <h3 className="text-xs font-bold">온라인 강의</h3>

          <div className="mt-3 space-y-2">
            {selected
              .filter((course) => course.isOnline)
              .map((course) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-[#ececf0] bg-[#fafafd] px-3 py-2.5"
                  key={course.id}
                >
                  <div>
                    <b className="block text-[9px]">{course.title}</b>

                    <small className="mt-1 block text-[8px] text-[#9699a7]">
                      {course.courseCode} · {course.professorName}
                    </small>
                  </div>

                  <span
                    className="rounded-md px-2 py-1 text-[8px] font-medium"
                    style={{
                      backgroundColor: (colorOf.get(course.id) ?? palette[0]).bg,
                      color: (colorOf.get(course.id) ?? palette[0]).text,
                    }}
                  >
                    온라인
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
