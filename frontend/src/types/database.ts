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
  collegeName?: string;
  facultyName?: string;
  majorName: string;
  generalEducationArea?: string;
  generalEducationElectiveArea?: string;
}

// 관리자 페이지에서 관리하는 필터 분류 정보
// parentId를 통해 상위 필터와 하위 필터의 계층 구조를 표현
export interface FilterCategory {
  id: number;
  name: string;
  parentId?: number;
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
  completedCredits: number;
  graduationCredits: number;
  maxCredits: number;
  departmentId: number;
}

// 과목 검색에 사용되는 필터 정보
export interface CourseFilter {
  id: number;
  name: string;
  isFixed: boolean;
  options: CourseFilterOption[];
}

// 필터의 선택 항목 및 하위 필터 정보
export interface CourseFilterOption {
  id: number;
  name: string;
  field?: string;
  value?: string | number | boolean;
  children?: CourseFilterOption[];
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
  facultyName?: string;
  collegeName?: string;
  generalEducationArea?: string;
  generalEducationElectiveArea?: string;
  isOnline: boolean;
  schedules: CourseSchedule[];
}