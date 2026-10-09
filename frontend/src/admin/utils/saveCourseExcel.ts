import * as XLSX from "xlsx";
import type { CourseListItem } from "../../shared/types/database";
import { getClassificationPath } from "../../shared/data/courseClassification";
import { convertCourseExcel } from "./importCourses";

export async function appendCourseExcel(
  handle: FileSystemFileHandle,
  course: CourseListItem,
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
  if (rows.slice(1).some((row) =>
    String(row[5] ?? "").trim() === course.courseCode &&
    String(row[7] ?? "").trim() === course.sectionNo,
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
  const { errors } = convertCourseExcel([...rows, ...newRows], []);
  if (errors.length) {
    throw new Error(`${errors[0].row}행: ${errors[0].message}`);
  }
  XLSX.utils.sheet_add_aoa(sheet, newRows, { origin: -1 });
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
