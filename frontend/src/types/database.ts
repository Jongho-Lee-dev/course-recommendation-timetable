export interface Course {
  courseCode: string;
  title: string;
  category: string;
  credit: number;
  theoryHours: number;
  labHours: number;
}

export interface OpenCourse {
  id: number;
  sectionNo: string;
  professorName: string;
  capacity: number;
  targetGrade: number;
  courseCode: string;
  departmentId: number;
}

export interface Enrollment {
  id: number;
  isRetake: boolean;
  status: string;
  createdAt: string;
  studentId: string;
  openCourseId: number;
}

export interface Department {
  id: number;
  collegeName: string;
  generalEducationArea?: string;
  generalEducationElectiveArea?: string;
  facultyName: string;
  majorName: string;
}

export interface CourseSchedule {
  id: number;
  dayOfWeek: string;
  startPeriod: number;
  endPeriod: number;
  classroom: string;
  openCourseId: number;
}

export interface Student {
  studentId: string;
  name: string;
  grade: number;
  completedSemesters: number;
  maxCredits: number;
  departmentId: number;
}

// HomePage에서 사용하는 과목 목록 데이터
export interface CourseListItem {
  id: number; 
  courseCode: string;
  title: string;
  category: string;
  credit: number;
  sectionNo: string;
  professorName: string;
  capacity: number;
  targetGrade: number;
  departmentId: number;
  majorName: string;
  collegeName: string;
  generalEducationArea?: string;
  generalEducationElectiveArea?: string;
  schedules: CourseSchedule[];
}