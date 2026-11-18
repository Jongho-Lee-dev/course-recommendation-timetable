export type Notice = {
  id: number;
  category: string;
  title: string;
  date: string;
  important?: boolean;
  body: string;
};
export const notices: Notice[] = [
  {
    id: 1,
    category: "수강신청",
    title: "2026학년도 2학기 수강신청 일정 안내",
    date: "2026.08.24",
    important: true,
    body: "수강신청 및 정정 기간을 확인해 주세요. 학과별 수강 가능 학년과 신청 제한 과목을 반드시 확인하시기 바랍니다.",
  },
  {
    id: 2,
    category: "학사",
    title: "수강신청 전 졸업요건 및 이수구분 확인 안내",
    date: "2026.08.21",
    important: true,
    body: "수강신청 전에 전공필수, 교양영역, 졸업학점 등 개인별 이수 현황을 확인해 주세요.",
  },
  {
    id: 3,
    category: "장애안내",
    title: "수강신청 시스템 점검 일정 안내",
    date: "2026.08.18",
    body: "원활한 서비스 제공을 위해 시스템 점검이 진행됩니다. 점검 시간에는 일부 기능이 제한될 수 있습니다.",
  },
  {
    id: 4,
    category: "학사",
    title: "강의계획서 조회 및 강의실 변경 확인 안내",
    date: "2026.08.14",
    body: "개설 강좌의 강의계획서와 강의실 정보를 확인해 주세요. 개강 전 변경 사항이 발생할 수 있습니다.",
  },
  {
    id: 5,
    category: "일반",
    title: "모바일 수강신청 이용 시 유의사항",
    date: "2026.08.10",
    body: "네트워크 상태에 따라 신청 결과 반영이 지연될 수 있으므로 신청 완료 여부를 반드시 확인하시기 바랍니다.",
  },
];
