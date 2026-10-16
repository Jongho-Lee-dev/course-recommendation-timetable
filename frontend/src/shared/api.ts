import { useUserStore } from "../registration/store/userStore";
import type { CourseListItem } from "./types/database";
const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export async function api<T>(path: string, options: RequestInit = {}, role: "admin" | "student" = "admin"): Promise<T> {
  const token = role === "student" ? sessionStorage.getItem("student-token") : null;
  const response = await fetch(`${base}/api${path}`, {
    ...options,
    headers: { ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  if (!response.ok) {
    if (response.status === 401 && role === "student") useUserStore.getState().reset();
    const error = await response.json().catch(() => ({}));
    throw new Error(typeof error.detail === "string" ? error.detail : `요청 실패 (${response.status})`);
  }
  if (path.endsWith(".xlsx")) return await response.blob() as T;
  return await response.json() as T;
}
export async function saveCourse(course: CourseListItem, editId?: number) {
  return api<CourseListItem[]>(`/admin/courses${editId ? `/${editId}` : ""}`, {method: editId ? "PUT" : "POST", body: JSON.stringify(course)});
}
export async function downloadExcel() {
  const blob = await api<Blob>("/admin/courses.xlsx");
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = "과목_최신목록.xlsx"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
