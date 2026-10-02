/**
 * 수강신청 사이트 DB 설계 명세 (실제 DB 생성/연결 코드는 아님).
 * 기존 화면용 타입은 유지하고, DatabaseTables에서 영속화할 행 타입을 정의한다.
 * ID는 정수, 학번/학수번호는 앞자리 0을 보존하는 문자열이다.
 * DateTime은 UTC ISO 8601 문자열, 화면 표시는 Asia/Seoul 기준이다.
 * DB의 nullable 컬럼은 null, 기존 화면 타입의 선택 필드는 undefined를 사용한다.
 * 학점은 소수 허용 DECIMAL, 교시/정원/학년/정렬 순서는 정수를 권장한다.
 */
export type DateTime = string;

// 과목 자체의 기본 정보
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
  isFixed?: boolean;
  field?: string;
  value?: string | number | boolean;
  childFields?: string[];
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
  field?: string;
  value?: string | number | boolean;
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

// 여러 테이블을 JOIN하여 만드는 화면용 DTO. 이 형태 전체를 DB에 중복 저장하지 않는다.
export interface CourseListItem {
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

// ---------------------------------------------------------------------------
// DB 테이블 행: 아래 타입의 필드는 별도 표시가 없으면 NOT NULL이다.
// ---------------------------------------------------------------------------

/** semesters: UNIQUE(year, term). 현재 화면의 고정 문구 '2026-2학기'를 대체한다. */
export interface Semester {
  id: number;
  year: number;
  term: "1" | "summer" | "2" | "winter";
  startsOn: string; // DATE, YYYY-MM-DD
  endsOn: string; // DATE, startsOn <= endsOn
}

/** departments: 교양 분류는 학과가 아닌 classifications에서 관리한다. */
export interface DepartmentRow {
  id: number;
  collegeName: string | null;
  facultyName: string | null;
  majorName: string;
}

/** courses: PK(courseCode). 분류는 개설 강좌에 연결하여 학기별 변경을 보존한다. */
export type CourseRow = Omit<Course, "category" | "courseType">;

/** open_courses: UNIQUE(semesterId, courseCode, sectionNo). */
export interface OpenCourseRow extends OpenCourse {
  semesterId: number; // FK semesters.id
  classificationId: number | null; // FK classifications.id, 분류 경로의 마지막 노드
  createdAt: DateTime;
  updatedAt: DateTime;
}

/** classifications: 관리자 ClassificationEditor의 임의 깊이 분류 트리. */
export interface Classification {
  id: number;
  parentId: number | null; // FK classifications.id; 루트는 null, 순환/자기 참조 금지
  name: string;
  sortOrder: number;
}

/** open_course_excluded_departments: 복합 PK(openCourseId, departmentId). */
export interface OpenCourseExcludedDepartment {
  openCourseId: number; // FK open_courses.id
  departmentId: number; // FK departments.id
}

/** course_schedules: FK openCourseId → open_courses.id, 끝 교시 포함. */
export interface CourseScheduleRow extends CourseSchedule {
  dayOfWeek: "월" | "화" | "수" | "목" | "금" | "토" | "일";
}

/** students: PK(studentId), FK departmentId → departments.id. */
export interface StudentRow extends Student {
  createdAt: DateTime;
  updatedAt: DateTime;
}

/**
 * accounts: 운영 시 필요한 인증/권한 모델 제안. 현재 사용자 입력 폼은 인증이 아니다.
 * UNIQUE(authSubject), UNIQUE(studentId) WHERE studentId IS NOT NULL.
 * 인증 제공자의 subject만 저장하며 비밀번호/인증 토큰은 이 타입에 포함하지 않는다.
 */
export interface Account {
  id: number;
  authSubject: string;
  role: "student" | "admin";
  studentId: string | null; // FK students.studentId; 학생 계정은 필수
  createdAt: DateTime;
}

/** course_carts: 현재 시간표(selected). UNIQUE(studentId, openCourseId). */
export type CourseCartRow = CourseCart;

/** course_favorites: 관심 과목(favorites). UNIQUE(studentId, openCourseId). */
export interface CourseFavorite {
  id: number;
  studentId: string; // FK students.studentId
  openCourseId: number; // FK open_courses.id
  createdAt: DateTime;
}

export type EnrollmentStatus = "enrolled" | "cancelled";

/**
 * enrollments: 신청내역(history)의 실제 저장 대상. UNIQUE(studentId, openCourseId).
 * 취소는 행 삭제 대신 status/cancelledAt 변경, 재신청은 동일 행 재활성화.
 * isRetake는 학사 이수 기록과 검증해야 하며 현재 목업만으로 확정할 수 없다.
 */
export interface EnrollmentRow extends Omit<Enrollment, "status"> {
  status: EnrollmentStatus;
  updatedAt: DateTime;
  cancelledAt: DateTime | null;
}

/** enrollment_events: 신청/취소/재신청 이력. append-only로 보존한다. */
export interface EnrollmentEvent {
  id: number;
  enrollmentId: number; // FK enrollments.id
  actorAccountId: number; // FK accounts.id
  action: "enrolled" | "cancelled";
  createdAt: DateTime;
}

/** registration_windows: 학기별 신청/정정 기간. CHECK(startsAt < endsAt). */
export interface RegistrationWindow {
  id: number;
  semesterId: number; // FK semesters.id
  name: string;
  startsAt: DateTime;
  endsAt: DateTime;
  stopped: boolean;
  updatedBy: number; // FK accounts.id, 관리자 권한 검증
  updatedAt: DateTime;
}

/** syllabi: UNIQUE(openCourseId), 강의계획서의 파일 메타데이터. */
export interface Syllabus {
  id: number;
  openCourseId: number; // FK open_courses.id
  storageKey: string; // 파일 본체는 객체 저장소, File/blob URL/만료 URL은 저장하지 않는다.
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: number; // FK accounts.id
  uploadedAt: DateTime;
}

/** filter_categories: 검색 필터 설정. 과목의 실제 분류 트리와 구분한다. */
export interface FilterCategoryRow {
  id: number;
  name: string;
  parentId: number | null; // FK filter_categories.id, 순환 금지
  isFixed: boolean;
  field: string | null; // 서버에서 허용된 검색 필드만 사용, SQL에 직접 삽입 금지
  value: string | number | boolean | null; // JSON scalar, 문자열/숫자/불리언 구분 유지
  childFields: string[]; // JSON 배열
  sortOrder: number;
}

/** recommendation_preferences: 선택적 저장. 현재 추천 결과는 계산값이며 저장 불필요. */
export interface RecommendationPreference {
  studentId: string; // 복합 PK, FK students.studentId
  semesterId: number; // 복합 PK, FK semesters.id
  credits: number;
  majorOnly: boolean;
  online: boolean; // true이면 온라인 강좌도 허용 (온라인 전용 의미 아님)
  avoidMorning: boolean;
  updatedAt: DateTime;
}

/** 테이블명 → 행 타입. 테이블/마이그레이션 구현 시 기준으로 사용한다. */
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
}

/**
 * DB 구현 규칙
 * - 별도 복합 PK/문자열 PK 명시가 없는 테이블은 id를 PK로 사용한다.
 * - OpenCourse의 courseCode/departmentId는 각각 courses/ departments의 FK이다.
 * - carts/favorites/enrollments의 studentId/openCourseId도 각각 학생/개설 강좌 FK이다.
 * - 모든 FK는 기본 ON DELETE RESTRICT. 신청 기록이 있는 학기/학생/강좌를 삭제하지 않는다.
 * - CHECK: credit/theoryHours/labHours/모든 학생 학점/sizeBytes/sortOrder >= 0,
 *   capacity > 0, grade >= 1, targetGrade >= 1, 1 <= startPeriod <= endPeriod.
 * - CHECK: enrolled이면 cancelledAt IS NULL, cancelled이면 cancelledAt IS NOT NULL.
 * - 분류는 같은 부모 아래 이름 중복 금지(루트의 NULL도 동일 부모로 처리).
 * - 인덱스: 모든 FK, open_courses(semesterId, departmentId, targetGrade),
 *   enrollments(openCourseId, status), enrollments(studentId, status),
 *   registration_windows(semesterId, startsAt, endsAt).
 * - 신청 트랜잭션은 학생/강좌 행을 일정한 순서로 잠그고 서버 시간 기준 신청 기간,
 *   정원, 최대 학점, 시간 중복, 동일 과목의 다른 분반 중복, 제외 학과를 재검증한다.
 *   정원 계산에는 enrolled만 포함한다. targetGrade의 엄격 제한 여부는 학사 정책 확정 필요.
 * - 현재 규칙처럼 온라인 강좌는 시간 충돌 검사에서 제외한다.
 * - 시간표/관심 과목은 신청 확정과 별개다. 남은 정원/총 신청 학점/남은 시간/
 *   진행 상태/분류 경로/학과 표시명은 JOIN 또는 계산으로 제공한다.
 * - CourseFilter/options는 filter_categories를 트리로 조립한 DTO이며 별도 테이블이 아니다.
 * - DB 제약/트랜잭션은 백엔드에서 구현해야 한다. TS 타입만으로 강제되지 않는다.
 */
