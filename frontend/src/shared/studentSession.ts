import { departments } from "./data/departments";
export interface StudentProfile {
  studentId: string;
  name: string;
  grade: number;
  departmentId: number;
  completedCredits: number;
  graduationCredits: number;
  maxCredits: number;
}
export function toUser(student: StudentProfile) {
  const department = departments.find((d) => d.id === student.departmentId);
  return {
    ...student,
    major: department?.majorName ?? "",
    collegeName: department?.collegeName,
    facultyName: department?.facultyName,
  };
}
