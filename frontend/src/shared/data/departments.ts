import type { Department } from "../types/database";

// 학과코드는 소속 및 수강 제외 대상에서 함께 사용하는 고유 번호입니다.
export const departments: Department[] = [
  {
    "id": 1,
    "collegeName": "AI·SW창의융합대학",
    "majorName": "컴퓨터공학과",
    "facultyName": "컴퓨터소프트웨어학부"
  },
  {
    "id": 2,
    "collegeName": "AI·SW창의융합대학",
    "majorName": "소프트웨어학과",
    "facultyName": "컴퓨터소프트웨어학부"
  },
  {
    "id": 3,
    "collegeName": "경영대학",
    "facultyName": "경영학부",
    "majorName": "경영학과"
  },
  {
    "id": 4,
    "facultyName": "자유전공학부",
    "majorName": "자유전공"
  },
  {
    "id": 5,
    "majorName": "특수전공"
  },
  {
    "id": 6,
    "collegeName": "공과대학",
    "facultyName": "건축학부",
    "majorName": "건축학과"
  },
  {
    "id": 7,
    "majorName": "법학과"
  },
  {
    "id": 10,
    "collegeName": "교양대학",
    "majorName": "교양학부"
  },
  {
    "id": 11,
    "collegeName": "AI·SW창의융합대학",
    "facultyName": "AI융합학부",
    "majorName": "인공지능학과"
  },
  {
    "id": 12,
    "collegeName": "AI·SW창의융합대학",
    "facultyName": "데이터사이언스학부",
    "majorName": "데이터사이언스학과"
  },
  {
    "id": 13,
    "collegeName": "AI·SW창의융합대학",
    "facultyName": "컴퓨터소프트웨어학부",
    "majorName": "정보보안학과"
  },
  {
    "id": 14,
    "collegeName": "공과대학",
    "majorName": "기계공학과"
  },
  {
    "id": 15,
    "collegeName": "공과대학",
    "facultyName": "건설환경학부",
    "majorName": "토목공학과"
  }
];
