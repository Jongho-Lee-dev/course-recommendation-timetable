import * as XLSX from "xlsx"
import { departments } from "../../shared/data/departments";
import type { CourseListItem } from "../../shared/types/database";

const EXPECTED_HEADERS = [
  "구분", "이수 구분", "영역", "하위 영역 1", "하위 영역 2",
  "학수번호", "과목명", "분반", "담당교수",
  "학점", "정원", "대상학년", "학과코드",
  "온라인/오프라인",
  "요일", "시작교시", "종료교시", "강의실",
  "제외 학과코드",
];

export async function readCourseExcel(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  })
}

export type ExcelValidationError = {
  row: number;
  message: string;
};

export function validateCourseExcel(
  rows: unknown[][],
): ExcelValidationError[] {
  const errors: ExcelValidationError[] = [];
  const text = (value: unknown) => String(value ?? "").trim();
  const departmentIds = new Set(departments.map((dept) => dept.id));

  const addError = (row: number, message: string) => {
    errors.push({ row, message });
  };

  const headers = rows[0] ?? [];

  if (
    headers.length !== EXPECTED_HEADERS.length ||
    EXPECTED_HEADERS.some((name, index) => text(headers[index]) !== name)
  ) {
    addError(1, "컬럼명과 순서가 A~S열 양식과 일치하지 않습니다.");
    return errors;
  }

  let dataCount = 0;

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const values = row.map(text);
    const get = (column: number) => values[column] ?? "";

    if (values.every((value) => !value)) return;
    dataCount++;

    if (values.slice(19).some(Boolean)) {
      addError(rowNumber, "S열 뒤에 데이터가 있습니다.");
    }

    const requiredColumns = [0, 1, 5, 6, 7, 8, 9, 10, 11, 12, 13];

    requiredColumns.forEach((column) => {
      if (!get(column)) {
        addError(rowNumber, `${EXPECTED_HEADERS[column]}을 입력하세요.`);
      }
    });

    for (let column = 2; column <= 4; column++) {
      if (get(column) && !get(column - 1)) {
        addError(
          rowNumber,
          `${EXPECTED_HEADERS[column]} 앞의 분류를 입력하세요.`,
        );
      }
    }

    const checkNumber = (
      column: number,
      min: number,
      integer: boolean,
    ) => {
      if (!get(column)) return;

      const value = Number(get(column));

      if (
        !Number.isFinite(value) ||
        value < min ||
        (integer && !Number.isInteger(value))
      ) {
        addError(
          rowNumber,
          `${EXPECTED_HEADERS[column]}은 ${min} 이상의 ${
            integer ? "정수" : "숫자"
          }여야 합니다.`,
        );
      }
    };

    checkNumber(9, 0, false);
    checkNumber(10, 1, true);
    checkNumber(11, 1, true);

    if (get(12) && !departmentIds.has(Number(get(12)))) {
      addError(rowNumber, `존재하지 않는 학과코드: ${get(12)}`);
    }

    const lessonType = get(13);

    if (lessonType && !["온라인", "오프라인"].includes(lessonType)) {
      addError(rowNumber, "수업형태는 온라인 또는 오프라인으로 입력하세요.");
    }

    if (lessonType === "오프라인") {
      for (const column of [14, 15, 16, 17]) {
        if (!get(column)) {
          addError(rowNumber, `${EXPECTED_HEADERS[column]}을 입력하세요.`);
        }
      }

      if (
        get(14) &&
        !["월", "화", "수", "목", "금", "토", "일"].includes(get(14))
      ) {
        addError(rowNumber, "요일은 월~일 중 하나로 입력하세요.");
      }

      checkNumber(15, 1, true);
      checkNumber(16, 1, true);

      if (
        get(15) &&
        get(16) &&
        Number(get(16)) < Number(get(15))
      ) {
        addError(rowNumber, "종료교시가 시작교시보다 빠릅니다.");
      }
    }

    if (
      lessonType === "온라인" &&
      [14, 15, 16, 17].some((column) => get(column))
    ) {
      addError(rowNumber, "온라인 과목의 요일·교시·강의실은 비워주세요.");
    }

    if (get(18)) {
      const codes = get(18).split(",").map((code) => code.trim());

      if (
        codes.some(
          (code) => !code || !departmentIds.has(Number(code)),
        )
      ) {
        addError(
          rowNumber,
          "제외 학과코드는 존재하는 번호를 쉼표로 구분해서 입력하세요.",
        );
      }
    }
  });

  if (dataCount === 0) {
    addError(2, "등록할 과목 데이터가 없습니다.");
  }

  return errors;
}

export function convertCourseExcel(
  rows: unknown[][],
  existingCourses: CourseListItem[],
): {
  courses: CourseListItem[];
  errors: ExcelValidationError[];
} {
  const errors = validateCourseExcel(rows);

  if (errors.length > 0) {
    return { courses: [], errors };
  }

  const text = (value: unknown) => String(value ?? "").trim();

  const makeKey = (courseCode: string, sectionNo: string) =>
    JSON.stringify([courseCode, sectionNo]);

  const existingByKey = new Map(
    existingCourses.map((course) => [
      makeKey(course.courseCode, course.sectionNo),
      course,
    ]),
  );

  let nextCourseId =
    Math.max(0, ...existingCourses.map((course) => course.id)) + 1;

  let nextScheduleId =
    Math.max(
      0,
      ...existingCourses.flatMap((course) =>
        course.schedules.map((schedule) => schedule.id),
      ),
    ) + 1;

  const grouped = new Map<
    string,
    {
      course: CourseListItem;
      signature: string;
      firstRow: number;
    }
  >();

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const get = (column: number) => text(row[column]);

    if (row.every((value) => !text(value))) return;

    const courseCode = get(5);
    const sectionNo = get(7);
    const key = makeKey(courseCode, sectionNo);

    const department = departments.find(
      (item) => item.id === Number(get(12)),
    );

    if (!department) {
      errors.push({
        row: rowNumber,
        message: "학과코드를 확인하세요.",
      });
      return;
    }

    const classificationPath = [0, 1, 2, 3, 4]
      .map(get)
      .filter(Boolean);

    const excludedDepartmentIds = get(18)
      ? [...new Set(get(18).split(",").map(Number))]
          .sort((a, b) => a - b)
      : [];

    const basicInfo = {
      courseCode,
      sectionNo,
      title: get(6),
      professorName: get(8),
      credit: Number(get(9)),
      capacity: Number(get(10)),
      targetGrade: Number(get(11)),
      departmentId: department.id,
      majorName: department.majorName,
      collegeName: department.collegeName,
      facultyName: department.facultyName,
      isOnline: get(13) === "온라인",
      classificationPath,
      category: classificationPath[0] ?? "",
      courseType: classificationPath[1] ?? "",
      generalEducationArea: classificationPath[2] ?? "",
      generalEducationElectiveArea: classificationPath[3] ?? "",
      excludedDepartmentIds,
    };

    const signature = JSON.stringify(basicInfo);
    let entry = grouped.get(key);

    if (entry && entry.signature !== signature) {
      errors.push({
        row: rowNumber,
        message:
          `${entry.firstRow}행과 같은 학수번호·분반인데 ` +
          "분류, 과목명, 교수, 학점 등 기본정보가 다릅니다.",
      });
      return;
    }

    if (!entry) {
      const existing = existingByKey.get(key);

      entry = {
        firstRow: rowNumber,
        signature,
        course: {
          ...basicInfo,
          id: existing ? existing.id : nextCourseId++,
          schedules: [],
        },
      };

      grouped.set(key, entry);
    }

    if (!basicInfo.isOnline) {
      const schedule = {
        dayOfWeek: get(14),
        startPeriod: Number(get(15)),
        endPeriod: Number(get(16)),
        classroom: get(17),
      };

      const duplicate = entry.course.schedules.some(
        (item) =>
          item.dayOfWeek === schedule.dayOfWeek &&
          item.startPeriod === schedule.startPeriod &&
          item.endPeriod === schedule.endPeriod &&
          item.classroom === schedule.classroom,
      );

      if (duplicate) {
        errors.push({
          row: rowNumber,
          message: "같은 강좌의 동일한 강의시간이 중복되었습니다.",
        });
        return;
      }

      entry.course.schedules.push({
        ...schedule,
        id: nextScheduleId++,
        openCourseId: entry.course.id,
      });
    }
  });

  return {
    courses:
      errors.length > 0
        ? []
        : Array.from(grouped.values(), (entry) => entry.course),
    errors,
  };
}