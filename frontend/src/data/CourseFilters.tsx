import type { CourseFilter } from "../types/database";

export const courseFilters: CourseFilter[] = [
  {
    id: 1,
    name: "전공",
    isFixed: false,
    options: [
      {
        id: 101,
        name: "인문사회대학",
        field: "collegeName",
        value: "인문사회대학",
        children: [
          {
            id: 1001,
            name: "국어국문한국어교육학과",
            field: "majorName",
            value: "국어국문한국어교육학과",
          },
          {
            id: 1002,
            name: "일본학과",
            field: "majorName",
            value: "일본학과",
          },
          {
            id: 1003,
            name: "경찰법학과",
            field: "majorName",
            value: "경찰법학과",
          },
          {
            id: 1004,
            name: "행정학과",
            field: "majorName",
            value: "행정학과",
          },
        ],
      },
      {
        id: 102,
        name: "경영대학",
        field: "collegeName",
        value: "경영대학",
        children: [
          {
            id: 2001,
            name: "경영학과",
            field: "majorName",
            value: "경영학과",
          },
          {
            id: 2002,
            name: "IT경영정보학과",
            field: "majorName",
            value: "IT경영정보학과",
          },
          {
            id: 2003,
            name: "관광경영학과",
            field: "majorName",
            value: "관광경영학과",
          },
        ],
      },
      {
        id: 103,
        name: "생명보건대학",
        field: "collegeName",
        value: "생명보건대학",
        children: [
          {
            id: 3001,
            name: "간호학과",
            field: "majorName",
            value: "간호학과",
          },
          {
            id: 3002,
            name: "식품영양학과",
            field: "majorName",
            value: "식품영양학과",
          },
          {
            id: 3003,
            name: "생명공학과",
            field: "majorName",
            value: "생명공학과",
          },
        ],
      },
      {
        id: 104,
        name: "AI·SW창의융합대학",
        field: "collegeName",
        value: "AI·SW창의융합대학",
        children: [
          {
            id: 4001,
            name: "컴퓨터공학과",
            field: "majorName",
            value: "컴퓨터공학과",
          },
          {
            id: 4002,
            name: "소프트웨어학",
            field: "majorName",
            value: "소프트웨어학",
          },
          {
            id: 4003,
            name: "정보보안학",
            field: "majorName",
            value: "정보보안학",
          },
          {
            id: 4004,
            name: "인공지능",
            field: "majorName",
            value: "인공지능",
          },
        ],
      },
      {
        id: 105,
        name: "문화예술대학",
        field: "collegeName",
        value: "문화예술대학",
        children: [
          {
            id: 5001,
            name: "디자인학부",
            field: "majorName",
            value: "디자인학부",
          },
          {
            id: 5002,
            name: "아트앤웹툰학부",
            field: "majorName",
            value: "아트앤웹툰학부",
          },
          {
            id: 5003,
            name: "공연예술학부",
            field: "majorName",
            value: "공연예술학부",
          },
        ],
      },
    ],
  },

  {
    id: 2,
    name: "교양",
    isFixed: false,
    options: [
      {
        id: 201,
        name: "교양 필수",
        field: "category",
        value: "교양 필수",
      },
      {
        id: 202,
        name: "교양 필수 선택",
        field: "category",
        value: "교양 필수 선택",
        children: [
          {
            id: 2021,
            name: "심화글쓰기영역",
            field: "generalEducationArea",
            value: "심화글쓰기영역",
          },
          {
            id: 2022,
            name: "AI·SW교육영역",
            field: "generalEducationArea",
            value: "AI·SW교육영역",
          },
          {
            id: 2023,
            name: "글로벌의사소통영역1",
            field: "generalEducationArea",
            value: "글로벌의사소통영역1",
          },
          {
            id: 2024,
            name: "글로벌의사소통영역2",
            field: "generalEducationArea",
            value: "글로벌의사소통영역2",
          },
          {
            id: 2025,
            name: "취·창업실무영역(비전설계영역)",
            field: "generalEducationArea",
            value: "취.창업실무영역(비전설계영역)",
          },
          {
            id: 2026,
            name: "균형기초학문영역(균형학문영역)",
            field: "generalEducationArea",
            value: "균형기초학문영역(균형학문영역)",
            children: [
              {
                id: 20261,
                name: "과학과 수리",
                field: "generalEducationElectiveArea",
                value: "과학과 수리",
              },
              {
                id: 20262,
                name: "경제와 사회(사회와 문화)",
                field: "generalEducationElectiveArea",
                value: "경제와 사회(사회와 문화)",
              },
              {
                id: 20263,
                name: "인문과 철학(인문과 예술)",
                field: "generalEducationElectiveArea",
                value: "인문과 철학(인문과 예술)",
              },
            ],
          },
        ],
      },
      {
        id: 203,
        name: "교양 선택",
        field: "category",
        value: "교양 선택",
      },
    ],
  },
  {
    id: 3,
    name: "학년",
    isFixed: true,
    options: [
      {
        id: 301,
        name: "1학년",
        field: "targetGrade",
        value: 1,
      },
      {
        id: 302,
        name: "2학년",
        field: "targetGrade",
        value: 2,
      },
      {
        id: 303,
        name: "3학년",
        field: "targetGrade",
        value: 3,
      },
      {
        id: 304,
        name: "4학년",
        field: "targetGrade",
        value: 4,
      },
    ],
  },

  {
    id: 4,
    name: "요일",
    isFixed: true,
    options: [
      {
        id: 401,
        name: "월",
        field: "schedules.dayOfWeek",
        value: "월",
      },
      {
        id: 402,
        name: "화",
        field: "schedules.dayOfWeek",
        value: "화",
      },
      {
        id: 403,
        name: "수",
        field: "schedules.dayOfWeek",
        value: "수",
      },
      {
        id: 404,
        name: "목",
        field: "schedules.dayOfWeek",
        value: "목",
      },
      {
        id: 405,
        name: "금",
        field: "schedules.dayOfWeek",
        value: "금",
      },
    ],
  },

  {
    id: 5,
    name: "수업 형태",
    isFixed: true,
    options: [
      {
        id: 501,
        name: "대면",
        field: "isOnline",
        value: false,
      },
      {
        id: 502,
        name: "온라인",
        field: "isOnline",
        value: true,
      },
    ],
  },

  {
    id: 6,
    name: "캠퍼스",
    isFixed: true,
    options: [
      {
        id: 601,
        name: "본관",
        field: "campus",
        value: "본관",
      },
      {
        id: 602,
        name: "별관",
        field: "campus",
        value: "별관",
      },
    ],
  },
];