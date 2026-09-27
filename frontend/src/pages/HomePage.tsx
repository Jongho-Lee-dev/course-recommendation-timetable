import { useState } from "react";
import "./HomePage.css";

type Course = {
  code: string;
  name: string;
  professor: string;
  time: string;
  room: string;
  credits: number;
  department: string;
  category: string;
  day: string;
  start: number;
  end: number;
};

const courses: Course[] = [
  { code: "CS201", name: "자료구조", professor: "김교수", time: "월 10:00", room: "IT Hall 301", credits: 3, department: "컴퓨터공학과", category: "전공", day: "월", start: 10, end: 12 },
  { code: "CS305", name: "컴퓨터 네트워크", professor: "박교수", time: "화 13:00", room: "IT Hall 202", credits: 3, department: "컴퓨터공학과", category: "전공", day: "화", start: 13, end: 15 },
  { code: "CS210", name: "알고리즘 설계", professor: "이교수", time: "수 14:00", room: "IT Hall 105", credits: 3, department: "컴퓨터공학과", category: "전공", day: "수", start: 14, end: 16 },
  { code: "CS310", name: "웹 프로그래밍", professor: "최교수", time: "목 10:00", room: "IT Hall 204", credits: 3, department: "소프트웨어학과", category: "전공", day: "목", start: 10, end: 12 },
  { code: "CS401", name: "데이터베이스", professor: "정교수", time: "금 13:00", room: "IT Hall 302", credits: 3, department: "컴퓨터공학과", category: "전공", day: "금", start: 13, end: 16 },
  { code: "GE102", name: "대학생활과 진로", professor: "박강사", time: "화 10:00", room: "인문관 203", credits: 2, department: "교양", category: "교양", day: "화", start: 10, end: 12 },
];

const days = ["월", "화", "수", "목", "금"];
const hours = Array.from({ length: 10 }, (_, i) => i + 9);

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<Course[]>(courses.slice(0, 3));
  const [credits, setCredits] = useState(15);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("현재 시간표를 분석해 최적의 조합을 추천해드릴게요.");

  const filteredCourses = courses.filter((course) =>
    `${course.name} ${course.code} ${course.professor}`.toLowerCase().includes(keyword.toLowerCase()),
  );

  const toggleCourse = (course: Course) => {
    const exists = selected.some((item) => item.code === course.code);
    if (exists) {
      setSelected((prev) => prev.filter((item) => item.code !== course.code));
      setCredits((prev) => prev - course.credits);
      return;
    }
    if (selected.length >= 6 || credits + course.credits > 18) return;
    setSelected((prev) => [...prev, course]);
    setCredits((prev) => prev + course.credits);
  };

  const generateAi = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      setAiMessage("현재 선택 과목 기준으로 공강과 수업일을 고려한 시간표를 찾았습니다.");
    }, 700);
  };

  return (
    <div className="course-page">
      <aside className="course-sidebar">
        <div className="sidebar-title">수강신청</div>
        <div className="sidebar-subtitle">2026학년도 2학기</div>
        <nav className="sidebar-nav">
          <button className="active"><span>▦</span> 대시보드</button>
          <button><span>⌕</span> 강의 검색</button>
          <button><span>▣</span> 나의 시간표</button>
          <button><span>✦</span> AI 시간표 추천</button>
          <button><span>♡</span> 관심 강좌</button>
          <button><span>✓</span> 신청 내역</button>
          <button><span>i</span> 공지사항</button>
        </nav>
        <div className="sidebar-profile">
          <div className="profile-avatar">김</div>
          <div>
            <strong>김도현</strong>
            <small>컴퓨터공학과 · 3학년</small>
          </div>
        </div>
      </aside>

      <main className="course-main">
        <section className="course-heading">
          <div>
            <div className="heading-kicker">2026학년도 2학기 수강 신청</div>
            <h1>수강 신청</h1>
          </div>
          <div className="heading-status">
            <div><span>수강 신청 현황</span><strong>진행 중</strong></div>
            <div><span>남은 시간</span><strong>01:25:34</strong></div>
            <div><span>신청 학점</span><strong>{credits}/18</strong></div>
          </div>
        </section>

        <div className="content-grid">
          <section className="registration-panel panel">
            <div className="panel-title-row">
              <div>
                <h2>강좌명 신청</h2>
                <p>원하는 강좌를 검색하고 시간표에 추가하세요.</p>
              </div>
              <button className="ai-mini-button" onClick={generateAi}>✦ AI 추천</button>
            </div>

            <div className="search-box">
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="강좌명 검색" />
              <input placeholder="교수명" />
              <select defaultValue="전체">
                <option>전체</option><option>전공</option><option>교양</option>
              </select>
              <button>검색</button>
            </div>

            <div className="filter-row">
              <select defaultValue="컴퓨터공학과"><option>컴퓨터공학과</option><option>전체 학과</option></select>
              <select defaultValue="3학년"><option>3학년</option><option>전체 학년</option></select>
              <select defaultValue="전체 요일"><option>전체 요일</option><option>월</option><option>화</option><option>수</option><option>목</option><option>금</option></select>
            </div>

            <div className="course-table">
              <div className="table-head">
                <span>강좌명</span><span>교수명</span><span>요일/시간/강의실</span><span>학점</span><span>정원</span><span>신청</span>
              </div>
              {filteredCourses.map((course) => {
                const isSelected = selected.some((item) => item.code === course.code);
                return (
                  <div className={`course-row ${isSelected ? "selected" : ""}`} key={course.code}>
                    <div><b>{course.name}</b><small>{course.code} · {course.category}</small></div>
                    <span>{course.professor}</span>
                    <span>{course.time}<small>{course.room}</small></span>
                    <span>{course.credits} cr</span>
                    <span className="capacity">{isSelected ? "신청완료" : "18/40"}</span>
                    <button className={isSelected ? "done" : "apply"} onClick={() => toggleCourse(course)}>{isSelected ? "취소" : "신청"}</button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="timetable-panel panel">
            <div className="panel-title-row">
              <div><h2>주간 시간표</h2><p>현재 신청한 강좌를 기준으로 표시됩니다.</p></div>
              <button className="outline-button">주간 새로고침</button>
            </div>
            <div className="timetable">
              <div className="time-labels"><div className="corner" />{hours.map((hour) => <div key={hour}>{hour}:00</div>)}</div>
              <div className="days-wrap">
                <div className="day-head">{days.map((day) => <div key={day}>{day}</div>)}</div>
                <div className="calendar-grid">
                  {days.map((day) => (
                    <div className="day-column" key={day}>
                      {hours.map((hour) => <div className="hour-cell" key={hour} />)}
                      {selected.filter((course) => course.day === day).map((course) => (
                        <div className="schedule-card" key={course.code} style={{ top: `${(course.start - 9) * 48}px`, height: `${(course.end - course.start) * 48}px` }}>
                          <b>{course.code}</b><strong>{course.name}</strong><small>{course.professor}</small>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="bottom-grid">
          <div className="selected-panel panel">
            <div className="panel-title-row compact">
              <div><h2>수강 신청 목록</h2><p>현재 선택한 강좌입니다.</p></div>
              <strong className="credit-total">신청 총 학점: {credits}학점</strong>
            </div>
            <div className="selected-list">
              {selected.map((course) => <div className="selected-item" key={course.code}><span>{course.name}</span><small>{course.code} · {course.professor}</small><b>{course.credits}학점</b></div>)}
            </div>
          </div>

          <div className="ai-result panel">
            <div className="ai-badge">✦ AI COURSE PLANNER</div>
            <h2>AI가 시간표를 분석하고 있습니다.</h2>
            <p>{aiMessage}</p>
            <div className="ai-stats"><div><span>현재 공강</span><b>{5 - new Set(selected.map((c) => c.day)).size}일</b></div><div><span>수업일</span><b>{new Set(selected.map((c) => c.day)).size}일</b></div><div><span>충돌</span><b className="safe">0건</b></div></div>
            <button className="ai-main-button" onClick={generateAi} disabled={aiLoading}>{aiLoading ? "AI가 분석 중..." : "✦ 최적 시간표 추천받기"}</button>
          </div>
        </section>
      </main>
    </div>
  );
}
