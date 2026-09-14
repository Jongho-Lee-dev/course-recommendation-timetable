import type { CourseListItem } from "../types/database";

export const mockCourses: CourseListItem[] = [
  {
    id: 1,
    courseCode: "CS201",
    title: "자료구조",
    category: "전공",
    credit: 3,

    sectionNo: "01",
    professorName: "김교수",
    capacity: 40,
    targetGrade: 2,

    departmentId: 1,
    majorName: "컴퓨터공학과",
    collegeName: "AI·SW창의융합대학",

    schedules: [
      {
        id: 1,
        dayOfWeek: "월",
        startPeriod: 2,
        endPeriod: 3,
        classroom: "IT Hall 301",
        openCourseId: 1,
      },
      {
        id: 2,
        dayOfWeek: "수",
        startPeriod: 2,
        endPeriod: 3,
        classroom: "IT Hall 301",
        openCourseId: 1,
      },
    ],
  },

  {
    id: 2,
    courseCode: "CS305",
    title: "컴퓨터 네트워크",
    category: "전공",
    credit: 3,

    sectionNo: "01",
    professorName: "박교수",
    capacity: 40,
    targetGrade: 3,

    departmentId: 1,
    majorName: "컴퓨터공학과",
    collegeName: "AI·SW창의융합대학",

    schedules: [
      {
        id: 3,
        dayOfWeek: "화",
        startPeriod: 4,
        endPeriod: 5,
        classroom: "IT Hall 202",
        openCourseId: 2,
      },
    ],
  },

  {
    id: 3,
    courseCode: "GE101",
    title: "대학생활과 진로",
    category: "교양 필수 선택",
    credit: 2,

    sectionNo: "01",
    professorName: "이강사",
    capacity: 50,
    targetGrade: 1,

    departmentId: 2,
    majorName: "교양학부",

    collegeName: "교양대학",
    generalEducationArea: "취.창업실무영역(비전설계영역)",

    schedules: [
      {
        id: 4,
        dayOfWeek: "수",
        startPeriod: 4,
        endPeriod: 5,
        classroom: "인문관 203",
        openCourseId: 3,
      },
    ],
  },

  {
    id: 4,
    courseCode: "GE202",
    title: "현대사회와 문화",
    category: "교양 선택",
    credit: 3,

    sectionNo: "01",
    professorName: "최교수",
    capacity: 45,
    targetGrade: 2,

    departmentId: 2,
    majorName: "교양학부",

    collegeName: "교양대학",
    generalEducationArea: "경제와 사회(사회와 문화)",

    schedules: [
      {
        id: 5,
        dayOfWeek: "목",
        startPeriod: 5,
        endPeriod: 6,
        classroom: "인문관 105",
        openCourseId: 4,
      },
    ],
  },
];