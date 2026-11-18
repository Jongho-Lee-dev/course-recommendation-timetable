import type { CourseListItem, Department, FilterCategory } from "../types/database";

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function getList<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const response = await fetch(`${baseUrl}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`데이터를 불러오지 못했습니다. (${response.status}) 백엔드 서버와 DB 연결을 확인하세요.`);
  }
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("백엔드 응답이 목록 형식이 아닙니다.");
  return payload as T[];
}

export async function fetchCatalog(signal: AbortSignal): Promise<{
  courses: CourseListItem[]; departments: Department[]; categories: FilterCategory[];
}> {
  const timeoutSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
  const [rawCourses, rawDepartments, rawCategories] = await Promise.all([
    getList<CourseListItem>("/courses", timeoutSignal),
    getList<Department>("/departments", timeoutSignal),
    getList<FilterCategory>("/filter-categories", timeoutSignal),
  ]);
  // PostgreSQL NULL을 기존 프론트의 선택 필드 형태로 맞춥니다.
  const courses = rawCourses.map(course => ({
    ...course,
    courseType: course.courseType ?? undefined,
    collegeName: course.collegeName ?? undefined,
    facultyName: course.facultyName ?? undefined,
    generalEducationArea: course.generalEducationArea ?? undefined,
    generalEducationElectiveArea: course.generalEducationElectiveArea ?? undefined,
    classificationPath: course.classificationPath ?? undefined,
    schedules: course.schedules ?? [],
    excludedDepartmentIds: course.excludedDepartmentIds ?? [],
  }));
  const departments = rawDepartments.map(department => ({
    ...department,
    collegeName: department.collegeName ?? undefined,
    facultyName: department.facultyName ?? undefined,
  }));
  const categories = rawCategories.map(category => ({
    ...category,
    parentId: category.parentId ?? undefined,
    field: category.field ?? undefined,
    value: category.value ?? undefined,
    childFields: category.childFields ?? [],
  }));
  return { courses, departments, categories };
}
