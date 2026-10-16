
export type DateTime = string;

export type CourseType = string;

export interface Course {
  courseCode: string;
  title: string;
  category: string;
  courseType?: CourseType;
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
  isOnline: boolean;
}

export interface Enrollment {
  id: number;
  isRetake: boolean;
  status: string;
  createdAt: string;
  studentId: string;
  openCourseId: number;
}

export interface CourseCart {
  id: number;
  studentId: string;
  openCourseId: number;
  createdAt: string;
}

export interface Department {
  id: number;
  collegeName?: string;
  facultyName?: string;
  majorName: string;
  generalEducationArea?: string;
  generalEducationElectiveArea?: string;
}

export interface FilterCategory {
  id: number;
  name: string;
  parentId?: number;
  isFixed?: boolean;
  field?: string;
  value?: string | number | boolean;
  childFields?: string[];
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
  completedCredits: number;
  graduationCredits: number;
  maxCredits: number;
  departmentId: number;
}

export interface CourseFilter {
  id: number;
  name: string;
  isFixed: boolean;
  field?: string;
  value?: string | number | boolean;
  options: CourseFilterOption[];
}

export interface CourseFilterOption {
  id: number;
  name: string;
  field?: string;
  value?: string | number | boolean;
  children?: CourseFilterOption[];
}

export interface CourseListItem {
  enrolledCount?: number;
  remainingSeats?: number;
  active?: boolean;
  classificationPath?: string[];
  excludedDepartmentIds?: number[];
  id: number;
  courseCode: string;
  title: string;
  category: string;
  courseType?: CourseType;
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

export interface Semester {
  id: number;
  year: number;
  term: "1" | "summer" | "2" | "winter";
  startsOn: string;
  endsOn: string;
}

export interface DepartmentRow {
  id: number;
  collegeName: string | null;
  facultyName: string | null;
  majorName: string;
}

export type CourseRow = Omit<Course, "category" | "courseType">;

export interface OpenCourseRow extends OpenCourse {
  semesterId: number;
  classificationId: number | null;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Classification {
  id: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
}

export interface OpenCourseExcludedDepartment {
  openCourseId: number;
  departmentId: number;
}

export interface CourseScheduleRow extends CourseSchedule {
  dayOfWeek: "월" | "화" | "수" | "목" | "금" | "토" | "일";
}

export interface StudentRow extends Student {
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface Account {
  id: number;
  authSubject: string;
  role: "student" | "admin";
  studentId: string | null;
  createdAt: DateTime;
}

export type CourseCartRow = CourseCart;

export interface CourseFavorite {
  id: number;
  studentId: string;
  openCourseId: number;
  createdAt: DateTime;
}

export type EnrollmentStatus = "enrolled" | "cancelled";

export interface EnrollmentRow extends Omit<Enrollment, "status"> {
  status: EnrollmentStatus;
  updatedAt: DateTime;
  cancelledAt: DateTime | null;
}

export interface EnrollmentEvent {
  id: number;
  enrollmentId: number;
  actorAccountId: number;
  action: "enrolled" | "cancelled";
  createdAt: DateTime;
}

export interface RegistrationWindow {
  id: number;
  semesterId: number;
  name: string;
  startsAt: DateTime;
  endsAt: DateTime;
  stopped: boolean;
  updatedBy: number;
  updatedAt: DateTime;
}

export interface Syllabus {
  id: number;
  openCourseId: number;
  storageKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: number;
  uploadedAt: DateTime;
}

export interface FilterCategoryRow {
  id: number;
  name: string;
  parentId: number | null;
  isFixed: boolean;
  field: string | null;
  value: string | number | boolean | null;
  childFields: string[];
  sortOrder: number;
}

export interface RecommendationPreference {
  studentId: string;
  semesterId: number;
  credits: number;
  majorOnly: boolean;
  online: boolean;
  avoidMorning: boolean;
  updatedAt: DateTime;
}

export interface DatabaseTables {
  semesters: Semester;
  departments: DepartmentRow;
  courses: CourseRow;
  classifications: Classification;
  open_courses: OpenCourseRow;
  open_course_excluded_departments: OpenCourseExcludedDepartment;
  course_schedules: CourseScheduleRow;
  students: StudentRow;
  accounts: Account;
  course_carts: CourseCartRow;
  course_favorites: CourseFavorite;
  enrollments: EnrollmentRow;
  enrollment_events: EnrollmentEvent;
  registration_windows: RegistrationWindow;
  syllabi: Syllabus;
  filter_categories: FilterCategoryRow;
  recommendation_preferences: RecommendationPreference;
  notices: NoticeRow;
}

export interface NoticeRow {
  id: number;
  category: "수강신청" | "학사" | "장애안내" | "일반";
  title: string;
  body: string;
  noticeDate: string;
  isImportant: boolean;
  createdAt: DateTime;
  updatedAt: DateTime;
}
