// 과목 자체의 기본 정보
export interface Course {
  courseCode: string;
  title: string;
  category: string;
  credit: number;
  theoryHours: number;
  labHours: number;
}

// 실제 개설된 과목(분반, 교수, 수강 정원 등)
export interface OpenCourse {
  id: number;
  sectionNo: string;
  professorName: string;
  capacity: number;
  targetGrade: number;
  courseCode: string;
  departmentId: number;
  isOnline: boolean;
}

// 학생의 수강신청 정보
export interface Enrollment {
  id: number;
  isRetake: boolean;
  status: string;
  createdAt: string;
  studentId: string;
  openCourseId: number;
}

// 학생이 장바구니에 담은 개설 과목 정보
export interface CourseCart {
  id: number;
  studentId: string;
  openCourseId: number;
  createdAt: string;
}

// 단과대 및 학과 정보
export interface Department {
  id: number;
  collegeName: string;
  generalEducationArea?: string;
  generalEducationElectiveArea?: string;
  facultyName: string;
  majorName: string;
}

// 개설 과목의 수업 시간 및 강의실 정보
export interface CourseSchedule {
  id: number;
  dayOfWeek: string;
  startPeriod: number;
  endPeriod: number;
  classroom: string;
  openCourseId: number;
}

// 학생 기본 정보
export interface Student {
  studentId: string;
  name: string;
  grade: number;
  completedSemesters: number;
  maxCredits: number;
  departmentId: number;
}

// HomePage에서 과목 목록을 표시하기 위해 여러 정보를 조합한 프론트 전용 타입
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
  isOnline: boolean;
  schedules: CourseSchedule[];
}