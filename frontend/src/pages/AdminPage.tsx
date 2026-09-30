import { useState } from "react";
import { departments } from "../data/departments";
import { mockCourses } from "../data/mockCourses";

export default function AdminPage() {
  const [selectCategory, setSelectCategory] = useState("학과");
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  return (
    <main className="mx-auto w-full max-w-[1500px]">
      <header className="w-full min-w-0 bg-[#f5f6f9] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7">
        <h2>관리자 페이지</h2>
      </header>

      <section className="flex w-full">
        <aside className="w-1/7">
          <div
            onClick={() => setSelectCategory("학과")}
            className="cursor-pointer"
          >
            학과
          </div>

          <div
            onClick={() => setSelectCategory("과목")}
            className="cursor-pointer"
          >
            과목
          </div>

          <div
            onClick={() => setSelectCategory("수강신청 설정")}
            className="cursor-pointer"
          >
            수강신청 설정
          </div>
        </aside>

        <div className="w-6/7">
          {selectCategory === "학과" && (
            <div>
              <h2>
                학과 수정하기
              </h2>
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="grid grid-cols-4 gap-4 border-b p-3"
                >
                  <div>{dept.id}</div>
                  <div>{dept.collegeName || <input />}</div>
                  <div>{dept.facultyName || <input />}</div>
                  <div>{dept.majorName || <input />}</div>
                </div>
              ))}
            </div>
          )}

          {selectCategory === "과목" && (
            <div>
              <h2 className="mb-4 text-lg font-bold">
                과목 수정하기
              </h2>

              {mockCourses.map((course) => (
                <div
                  key={course.id}
                  className="mb-3 rounded-lg border border-[#dddfe6]"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex gap-6">
                      <div>{course.courseCode}</div>
                      <div>{course.title}</div>
                      <div>{course.professorName}</div>
                      <div>{course.credit}학점</div>
                    </div>

                    <button
                      onClick={() =>
                        setEditingCourseId(
                          editingCourseId === course.id ? null : course.id
                        )
                      }
                      className="rounded-md border px-3 py-1 text-sm"
                    >
                      {editingCourseId === course.id ? "저장하기" : "수정하기"}
                    </button>
                  </div>

                  {editingCourseId === course.id && (
                    <div className="grid grid-cols-2 gap-4 border-t p-4">
                      <div>
                        <p>학수번호</p>
                        <input
                          value={course.courseCode}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>과목명</p>
                        <input
                          value={course.title}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>구분</p>
                        <input
                          value={course.category}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>이수구분</p>
                        <input
                          value={course.courseType}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>학점</p>
                        <input
                          value={course.credit}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>분반</p>
                        <input
                          value={course.sectionNo}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>담당교수</p>
                        <input
                          value={course.professorName}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>정원</p>
                        <input
                          value={course.capacity}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>대상학년</p>
                        <input
                          value={course.targetGrade}
                          className="w-full rounded border p-2"
                        />
                      </div>

                      <div>
                        <p>수업형태</p>
                        <div>
                          {course.isOnline ? "온라인" : "오프라인"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectCategory === "수강신청 설정" && (
            <div>
              <h2>
                수강신청 설정하기
              </h2>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}