import * as XLSX from "xlsx";
import type { CourseListItem } from "../../shared/types/database";
import { getClassificationPath } from "../../shared/data/courseClassification";
import { convertCourseExcel } from "./importCourses";

export async function appendCourseExcel(
  handle: FileSystemFileHandle,
  course: CourseListItem,
) {
  return saveCourseExcel(handle, course);
}

export async function updateCourseExcel(
  handle: FileSystemFileHandle,
  original: CourseListItem,
  course: CourseListItem,
) {
  return saveCourseExcel(handle, course, original);
}

async function saveCourseExcel(
  handle: FileSystemFileHandle,
  course: CourseListItem,
  original?: CourseListItem,
) {
  if (await handle.requestPermission({ mode: "readwrite" }) !== "granted") {
    throw new Error("엑셀 파일에 저장하려면 쓰기 권한을 허용하세요.");
  }

  const file = await handle.getFile();
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) throw new Error("엑셀 파일에 시트가 없습니다.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1, defval: "", raw: false,
  });

  const matches = (row: unknown[], target: CourseListItem) =>
    String(row[5] ?? "").trim() === target.courseCode.trim() &&
    String(row[7] ?? "").trim() === target.sectionNo.trim();
  const originalIndexes = new Set<number>();
  if (original) {
    rows.forEach((row, index) => {
      if (index > 0 && matches(row, original)) originalIndexes.add(index);
    });
    if (!originalIndexes.size) {
      throw new Error("선택한 엑셀에서 수정할 과목을 찾지 못했습니다. 수정 전 학수번호와 분반을 확인하세요.");
    }
  }
  if (rows.some((row, index) =>
    index > 0 && !originalIndexes.has(index) && matches(row, course),
  )) {
    throw new Error("엑셀에 같은 학수번호와 분반이 이미 있습니다.");
  }

  const path = getClassificationPath(course);
  if (path.length > 5) throw new Error("엑셀에는 분류를 5단계까지 저장할 수 있습니다.");

  const schedules = course.isOnline ? [null] : course.schedules;
  if (!schedules.length) throw new Error("강의 시간을 입력하세요.");

  const newRows = schedules.map((schedule) => [
    course.category, course.courseType ?? "", path[2] ?? "",
    path[3] ?? "", path[4] ?? "", course.courseCode, course.title,
    course.sectionNo, course.professorName, course.credit, course.capacity,
    course.targetGrade, course.departmentId,
    course.isOnline ? "온라인" : "오프라인",
    schedule?.dayOfWeek ?? "", schedule?.startPeriod ?? "",
    schedule?.endPeriod ?? "", schedule?.classroom ?? "",
    (course.excludedDepartmentIds ?? []).join(","),
  ]);

  const updatedRows: unknown[][] = [];
  let inserted = false;
  rows.forEach((row, index) => {
    if (originalIndexes.has(index)) {
      if (!inserted) updatedRows.push(...newRows);
      inserted = true;
    } else {
      updatedRows.push(row);
    }
  });
  if (!original) updatedRows.push(...newRows);
  const { errors } = convertCourseExcel(updatedRows, []);
  if (errors.length) {
    throw new Error(`${errors[0].row}행: ${errors[0].message}`);
  }
  
  if (original) {
    const updatedSheet = XLSX.utils.aoa_to_sheet(updatedRows);
    updatedSheet["!cols"] = sheet["!cols"];
    workbook.Sheets[workbook.SheetNames[0]] = updatedSheet;
  } else {
    XLSX.utils.sheet_add_aoa(sheet, newRows, { origin: -1 });
  }
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
}
