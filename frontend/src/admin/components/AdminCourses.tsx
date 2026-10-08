import { useMemo, useState } from "react";
import { BookOpen, Plus, Sheet } from "lucide-react";
import type {
  CourseListItem,
  CourseSchedule,
  Department,
} from "../../shared/types/database";
import { createCourseFilters } from "../../shared/data/CourseFilters";
import { filterCourses } from "../../shared/data/filterCourses";
import { sortCourses } from "../../shared/data/sortCourses";
import {
  getClassificationPath,
  withClassificationPath,
} from "../../shared/data/courseClassification";
import ClassificationEditor from "./ClassificationEditor";
import DepartmentTreeSelect from "./DepartmentTreeSelect";
import CourseFilters from "../../shared/components/CourseFilters";
import SyllabusLink, { PdfLink } from "../../shared/components/SyllabusLink";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";
import CourseExcelImport from "./CourseExcelImport";

const inputClass =
  "w-full min-w-0 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[11px] text-[#5d6070] outline-none focus:border-[#a99aed]";
const buttonClass =
  "cursor-pointer rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] font-semibold transition hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9]";
const primaryClass = `${buttonClass} border-[#7658e9] bg-[#7658e9] text-white hover:bg-[#6546d6]`;
const textFields = [
  ["courseCode", "학수번호"],
  ["title", "과목명"],
  ["sectionNo", "분반"],
  ["professorName", "담당교수"],
] as const;
const numberFields = [
  ["credit", "학점", 0],
  ["capacity", "정원", 1],
  ["targetGrade", "대상학년", 1],
] as const;

function createSchedule(openCourseId: number, id = 1): CourseSchedule {
  return {
    id,
    openCourseId,
    dayOfWeek: "월",
    startPeriod: 1,
    endPeriod: 1,
    classroom: "",
  };
}

function CourseForm({
  course,
  courses,
  departments,
  onSave,
  onCancel,
}: {
  course: CourseListItem;
  courses: CourseListItem[];
  departments: Department[];
  onSave: (course: CourseListItem, syllabus: File | null) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CourseListItem>(() => {
    const initial = structuredClone(course);
    if (!initial.isOnline && initial.schedules.length === 0)
      initial.schedules = [createSchedule(initial.id)];
    return initial;
  });
  const [error, setError] = useState("");
  const savedSyllabus = useCourseCatalogStore(
    (state) => state.syllabi[course.id],
  );
  const [syllabus, setSyllabus] = useState<File | null>(savedSyllabus ?? null);
  const [readingPdf, setReadingPdf] = useState(false);
  const [fileError, setFileError] = useState("");
  return (
    <form
      className="space-y-4 rounded-lg border border-[#e4e5eb] bg-[#fafafd] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (readingPdf || fileError) return;
        if (
          [
            draft.courseCode,
            draft.title,
            draft.category,
            draft.professorName,
            draft.sectionNo,
          ].some((value) => !value.trim())
        ) {
          setError("학수번호, 과목명, 구분, 분반, 담당교수를 입력하세요.");
          return;
        }
        if (!draft.departmentId) {
          setError("소속 학과를 선택하세요.");
          return;
        }
        if (!draft.courseType?.trim()) {
          setError("이수구분을 선택하거나 입력하세요.");
          return;
        }
        if (
          !draft.isOnline &&
          (draft.schedules.length === 0 ||
            draft.schedules.some(
              (schedule) =>
                schedule.endPeriod < schedule.startPeriod ||
                !schedule.classroom.trim(),
            ))
        ) {
          setError("강의 시간을 추가하고 종료 교시와 강의실을 확인하세요.");
          return;
        }
        onSave(
          {
            ...withClassificationPath(
              draft,
              getClassificationPath(draft).map((value) => value.trim()),
            ),
            courseType: draft.courseType?.trim() ?? "",
            courseCode: draft.courseCode.trim(),
            title: draft.title.trim(),
            professorName: draft.professorName.trim(),
            category: draft.category.trim(),
            sectionNo: draft.sectionNo.trim(),
            schedules: draft.isOnline ? [] : draft.schedules,
          },
          syllabus,
        );
      }}
    >
      <ClassificationEditor
        path={getClassificationPath(draft)}
        courses={[...courses, course]}
        onChange={(path) => {
          setDraft(withClassificationPath(draft, path));
          setError("");
        }}
      />
      <div className="grid gap-4 min-[701px]:grid-cols-2">
        {textFields.map(([key, label]) => (
          <label key={key} className="space-y-1.5 text-[#5d6070]">
            <span className="block font-semibold">{label}</span>
            <input
              className={inputClass}
              value={draft[key] ?? ""}
              required={[
                "courseCode",
                "title",
                "category",
                "sectionNo",
                "professorName",
              ].includes(key)}
              onChange={(event) =>
                setDraft({ ...draft, [key]: event.target.value })
              }
            />
          </label>
        ))}
        {numberFields.map(([key, label, min]) => (
          <label key={key} className="space-y-1.5 text-[#5d6070]">
            <span className="block font-semibold">{label}</span>
            <input
              className={inputClass}
              type="number"
              min={min}
              step={1}
              required
              value={draft[key]}
              onChange={(event) =>
                setDraft({ ...draft, [key]: Number(event.target.value) })
              }
            />
          </label>
        ))}
        <label className="space-y-1.5 text-[#5d6070]">
          <span className="block font-semibold">소속 학과</span>
          <select
            className={inputClass}
            required
            value={draft.departmentId || ""}
            onChange={(event) => {
              const department = departments.find(
                (item) => item.id === Number(event.target.value),
              );
              if (department)
                setDraft({
                  ...draft,
                  departmentId: department.id,
                  majorName: department.majorName,
                  facultyName: department.facultyName,
                  collegeName: department.collegeName,
                });
            }}
          >
            <option value="">학과 선택</option>
            {!departments.some((item) => item.id === draft.departmentId) &&
              draft.departmentId !== 0 && (
                <option value={draft.departmentId}>{draft.majorName}</option>
              )}
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {[
                  department.collegeName,
                  department.facultyName,
                  department.majorName,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-[#5d6070]">
          <span className="block font-semibold">수업형태</span>
          <select
            className={inputClass}
            value={draft.isOnline ? "online" : "offline"}
            onChange={(event) => {
              const isOnline = event.target.value === "online";
              setDraft({
                ...draft,
                isOnline,
                schedules:
                  !isOnline && draft.schedules.length === 0
                    ? [createSchedule(draft.id)]
                    : draft.schedules,
              });
              setError("");
            }}
          >
            <option value="offline">오프라인</option>
            <option value="online">온라인</option>
          </select>
        </label>
      </div>
      <div className="space-y-2 rounded-lg border border-[#e4e5eb] bg-white p-4">
        <label className="block space-y-2 font-semibold">
          <span>강의계획서 (PDF, 선택)</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={readingPdf}
            className={inputClass}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setFileError("");
              if (!file.name.toLowerCase().endsWith(".pdf")) {
                setFileError("PDF 파일만 첨부할 수 있습니다.");
                return;
              }
              if (file.size > 20 * 1024 * 1024) {
                setFileError("20MB 이하의 PDF 파일을 선택하세요.");
                return;
              }
              setReadingPdf(true);
              try {
                const header = new TextDecoder().decode(
                  await file.slice(0, 5).arrayBuffer(),
                );
                if (header !== "%PDF-") {
                  setFileError("올바른 PDF 파일을 선택하세요.");
                  return;
                }
                setSyllabus(file);
              } catch {
                setFileError("파일을 읽을 수 없습니다. 다시 선택하세요.");
              } finally {
                setReadingPdf(false);
              }
            }}
          />
        </label>
        <p className="text-[10px] text-[#858796]">
          최대 20MB · 다른 파일을 선택하면 저장 시 교체됩니다.
        </p>
        {readingPdf && <p role="status">PDF 확인 중…</p>}
        {fileError && (
          <p role="alert" className="text-red-600">
            {fileError}{" "}
            <button
              type="button"
              className={buttonClass}
              onClick={() => setFileError("")}
            >
              선택 취소
            </button>
          </p>
        )}
        {syllabus ? (
          <div className="flex flex-wrap items-center gap-3">
            <PdfLink file={syllabus} />
            <button
              type="button"
              disabled={readingPdf}
              className={buttonClass}
              onClick={() => {
                setSyllabus(null);
                setFileError("");
              }}
            >
              첨부 삭제
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-[#858796]">
            첨부된 강의계획서가 없습니다.
          </p>
        )}
      </div>
      <fieldset className="min-w-0 space-y-3 rounded-lg border border-[#e4e5eb] bg-[#fafafd] p-4">
        <legend className="px-2 font-semibold">수강 제외 대상 (선택)</legend>
        <p className="text-[#858796]">
          대학·학부를 선택하면 현재 소속된 학과가 모두 선택됩니다. 학과별로
          선택을 해제할 수 있으며, 선택하지 않으면 제외 대상이 없습니다.
        </p>
        <DepartmentTreeSelect
          departments={departments}
          selectedIds={draft.excludedDepartmentIds ?? []}
          onChange={(excludedDepartmentIds) =>
            setDraft({ ...draft, excludedDepartmentIds })
          }
        />
      </fieldset>
      {!draft.isOnline && (
        <>
          <div className="flex items-center justify-between gap-2 border-t border-[#e4e5eb] pt-4">
            <strong>강의 시간</strong>
            <button
              type="button"
              className={buttonClass}
              onClick={() =>
                setDraft({
                  ...draft,
                  schedules: [
                    ...draft.schedules,
                    createSchedule(
                      draft.id,
                      Math.max(0, ...draft.schedules.map((item) => item.id)) +
                      1,
                    ),
                  ],
                })
              }
            >
              시간 추가하기
            </button>
          </div>
          <p className="text-[#858796]">
            오프라인 강의는 강의 시간을 최소 1개 입력해야 합니다.
          </p>
          {draft.schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="grid items-end gap-3 rounded-lg border border-[#e4e5eb] bg-white p-3 min-[501px]:grid-cols-2 min-[1101px]:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
            >
              <label>
                요일
                <select
                  className={inputClass}
                  value={schedule.dayOfWeek}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      schedules: draft.schedules.map((item) =>
                        item.id === schedule.id
                          ? { ...item, dayOfWeek: event.target.value }
                          : item,
                      ),
                    })
                  }
                >
                  {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>
              {(["startPeriod", "endPeriod", "classroom"] as const).map(
                (key) => (
                  <label key={key}>
                    {key === "startPeriod"
                      ? "시작 교시"
                      : key === "endPeriod"
                        ? "종료 교시"
                        : "강의실"}
                    <input
                      className={inputClass}
                      required
                      type={key === "classroom" ? "text" : "number"}
                      min={key === "endPeriod" ? schedule.startPeriod : 1}
                      step={1}
                      value={schedule[key]}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          schedules: draft.schedules.map((item) =>
                            item.id === schedule.id
                              ? {
                                ...item,
                                [key]:
                                  key === "classroom"
                                    ? event.target.value
                                    : Number(event.target.value),
                              }
                              : item,
                          ),
                        })
                      }
                    />
                  </label>
                ),
              )}
              <button
                type="button"
                className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-40`}
                disabled={draft.schedules.length <= 1}
                onClick={() =>
                  setDraft({
                    ...draft,
                    schedules:
                      draft.schedules.length > 1
                        ? draft.schedules.filter(
                          (item) => item.id !== schedule.id,
                        )
                        : draft.schedules,
                  })
                }
              >
                삭제하기
              </button>
            </div>
          ))}
        </>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className={buttonClass} onClick={onCancel}>
          취소
        </button>
        <button
          type="submit"
          disabled={readingPdf || !!fileError}
          className={`${primaryClass} disabled:opacity-50`}
        >
          저장하기
        </button>
      </div>
    </form>
  );
}

export default function AdminCourses({
  courses,
  departments,
  onChange,
}: {
  courses: CourseListItem[];
  departments: Department[];
  onChange: (courses: CourseListItem[]) => void;
}) {
  const [mode, setMode] = useState<"choose" | "add" | "edit" | "excel">("choose");
  const setSyllabus = useCourseCatalogStore((state) => state.setSyllabus);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState("default");
  const [professorKeyword, setProfessorKeyword] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<number, number[]>
  >({});
  const filters = useMemo(() => createCourseFilters(courses), [courses]);
  const filtered = sortCourses(
    filterCourses(courses, filters, keyword, professorKeyword, selectedFilters),
    sort,
  );
  const resetFilters = () => {
    setKeyword("");
    setProfessorKeyword("");
    setSelectedFilters({});
    setSort("default");
  };
  const newId = Math.max(0, ...courses.map((course) => course.id)) + 1;
  const newCourse: CourseListItem = {
    id: newId,
    courseCode: "",
    title: "",
    category: "",
    courseType: "",
    credit: 3,
    sectionNo: "01",
    professorName: "",
    capacity: 40,
    targetGrade: 1,
    departmentId: 0,
    majorName: "",
    isOnline: false,
    schedules: [
      {
        id: 1,
        openCourseId: newId,
        dayOfWeek: "월",
        startPeriod: 1,
        endPeriod: 1,
        classroom: "",
      },
    ],
  };

  if (mode === "choose")
    return (
      <div>
        <h2 className="!mb-4 !text-sm !font-bold">과목 관리</h2>
        <div className="grid grid-cols-2 gap-3 min-[701px]:gap-4">
          {(
            [
              {
                mode: "add",
                title: "과목 추가",
                description: "새로운 과목과 강의 시간을 등록합니다.",
                icon: Plus,
              },
              {
                mode: "edit",
                title: "과목 수정",
                description: "필터로 과목을 찾아 정보를 수정합니다.",
                icon: BookOpen,
              },
              {
                mode: "excel",
                title: "엑셀 데이터 적용",
                description: "엑셀 파일에 작성한 내용을 저장합니다.",
                icon: Sheet,
              }
            ] as const
          ).map(({ mode: next, title, description, icon: Icon }) => (
            <button
              key={next}
              type="button"
              onClick={() => setMode(next)}
              className="flex cursor-pointer flex-col items-start gap-3 rounded-xl border border-[#e3e4e9] bg-[#fafafd] p-4 text-left transition hover:border-[#a99aed] hover:bg-[#f0edff] focus-visible:outline-2 focus-visible:outline-[#7658e9] min-[701px]:p-7"
            >
              <span className="rounded-xl bg-[#f0edff] p-3 text-[#7658e9]">
                <Icon size={24} />
              </span>
              <strong className="text-sm">{title}</strong>
              <span className="text-[11px] leading-5 text-[#858796]">
                {description}
              </span>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#ececf0] pb-4">
        <h2 className="!mb-0 !text-sm !font-bold">
          {mode === "add"
            ? "과목 추가하기"
            : mode === "excel"
              ? "엑셀 파일 업로드"
              : "과목 수정하기"}
        </h2>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            setMode("choose");
            setEditingId(null);
          }}
        >
          선택 화면으로
        </button>
      </div>
      {mode === "add" ? (
        <CourseForm
          key="new"
          course={newCourse}
          courses={courses}
          departments={departments}
          onCancel={() => setMode("choose")}
          onSave={(course, syllabus) => {
            onChange([...courses, course]);
            setSyllabus(course.id, syllabus);
            resetFilters();
            setMode("edit");
          }}
        />
      ) : mode === "excel" ? (
        <>
          <CourseExcelImport />
        </>
      ) : (
        <>
          <CourseFilters
            filters={filters}
            keyword={keyword}
            setKeyword={setKeyword}
            professorKeyword={professorKeyword}
            setProfessorKeyword={setProfessorKeyword}
            selectedFilters={selectedFilters}
            setSelectedFilters={setSelectedFilters}
            onReset={resetFilters}
            sort={sort}
            setSort={setSort}
          />
          <p className="mb-3 text-[#858796]">총 {filtered.length}개 과목</p>
          {filtered.map((course) => (
            <div
              key={course.id}
              className="mb-3 overflow-hidden rounded-lg border border-[#dddfe6]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[#5d6070]">
                  <span>{course.courseCode}</span>
                  <strong>{course.title}</strong>
                  <span>{course.professorName}</span>
                  <span>{course.credit}학점</span>
                </div>
                <SyllabusLink courseId={course.id} />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() =>
                      setEditingId(editingId === course.id ? null : course.id)
                    }
                  >
                    {editingId === course.id ? "닫기" : "수정하기"}
                  </button>
                  <button
                    type="button"
                    className={`${buttonClass} text-red-600`}
                    onClick={() => {
                      onChange(courses.filter((item) => item.id !== course.id));
                      setSelectedFilters({});
                      if (editingId === course.id) setEditingId(null);
                    }}
                  >
                    삭제하기
                  </button>
                </div>
              </div>
              {editingId === course.id && (
                <CourseForm
                  key={course.id}
                  course={course}
                  courses={courses}
                  departments={departments}
                  onCancel={() => setEditingId(null)}
                  onSave={(saved, syllabus) => {
                    onChange(
                      courses.map((item) =>
                        item.id === saved.id ? saved : item,
                      ),
                    );
                    setSyllabus(saved.id, syllabus);
                    setSelectedFilters({});
                    setEditingId(null);
                  }}
                />
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-lg bg-[#fafafd] p-10 text-center text-[#858796]">
              검색 조건에 맞는 과목이 없습니다.
            </p>
          )}
        </>
      )}
      <p className="mt-3 text-[10px] text-[#858796]">
        저장한 과목과 강의계획서는 검색 화면에도 적용됩니다. 새로고침하면
        초기화됩니다.
      </p>
    </div>
  );
}
