import { useState } from "react";
import "./HomePage.css";
import type { CourseListItem } from "../types/database";
import { mockCourses } from "../data/mockCourses";
import { collegeMajors } from "../data/collegeMajors";

const days = ["월", "화", "수", "목", "금"];
const periods = Array.from({ length: 10 }, (_, i) => i + 1);

export default function HomePage() {
  const [keyword, setKeyword] = useState("");
  const [professorKeyword, setProfessorKeyword] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "major" | "general">("all");

  const [selected, setSelected] = useState<CourseListItem[]>(
    mockCourses.slice(0, 2),
  );

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState(
    "현재 시간표를 분석해 최적의 조합을 추천해드릴게요.",
  );

  const [selectedDay, setSelectedDay] = useState("전체 요일");
  const [selectedGrade, setSelectedGrade] = useState("전체 학년");

  const [selectedCollege, setSelectedCollege] = useState("전체 학부");
  const [selectedMajor, setSelectedMajor] = useState("전체 전공");

  const [selectedGeneralEducation, setSelectedGeneralEducation] = useState("전체 교양");
  const [selectedGeneralEducationArea, setSelectedGeneralEducationArea] = useState("전체 영역");
  const [selectedGeneralEducationElectiveArea, setSelectedGeneralEducationElectiveArea] = useState("전체 영역");

  const majors = collegeMajors[selectedCollege] ?? [];

  const totalCredits = selected.reduce(
    (sum, item) => sum + item.credit,
    0,
  );

  const activeDaysCount = new Set(
    selected.flatMap((course) =>
      course.schedules.map((schedule) => schedule.dayOfWeek),
    ),
  ).size;

  const filteredCourses = mockCourses.filter((course) => {
    const matchesKeyword =
      !keyword.trim() ||
      `${course.title} ${course.courseCode}`
        .toLowerCase()
        .includes(keyword.toLowerCase());

    const matchesProfessor =
      !professorKeyword.trim() ||
      course.professorName
        .toLowerCase()
        .includes(professorKeyword.toLowerCase());

    const matchesDay =
      selectedDay === "전체 요일" ||
      course.schedules.some((schedule) => schedule.dayOfWeek === selectedDay);

    const matchesGrade =
      selectedGrade === "전체 학년" ||
      course.targetGrade === Number(selectedGrade.replace("학년", ""));

    if (!matchesKeyword || !matchesProfessor || !matchesDay || !matchesGrade) {
      return false;
    }

    const isGeneral = ["교필", "교필선", "교선"].includes(course.category);

    if (filterCategory === "major" && course.category !== "전공") return false;
    if (filterCategory === "general" && !isGeneral) return false;

    if (selectedCollege !== "전체 학부" && course.collegeName !== selectedCollege) return false;
    if (selectedMajor !== "전체 전공" && course.majorName !== selectedMajor) return false;

    if (selectedGeneralEducation !== "전체 교양" && course.category !== selectedGeneralEducation) return false;
    if (selectedGeneralEducationArea !== "전체 영역" && course.generalEducationArea !== selectedGeneralEducationArea) return false;
    if (selectedGeneralEducationElectiveArea !== "전체 영역" && course.generalEducationElectiveArea !== selectedGeneralEducationElectiveArea) return false;

    return true;
  });

  const handleResetFilters = () => {
    setKeyword("");
    setProfessorKeyword("");
    setFilterCategory("all");
    setSelectedDay("전체 요일");
    setSelectedGrade("전체 학년");
    setSelectedCollege("전체 학부");
    setSelectedMajor("전체 전공");
    setSelectedGeneralEducation("전체 교양");
    setSelectedGeneralEducationArea("전체 영역");
    setSelectedGeneralEducationElectiveArea("전체 영역");
  };

  const toggleCourse = (course: CourseListItem) => {
    const exists = selected.some((item) => item.id === course.id);

    if (exists) {
      setSelected((prev) =>
        prev.filter((item) => item.id !== course.id),
      );
      return;
    }

    if (selected.length >= 6 || totalCredits + course.credit > 18) {
      return;
    }

    setSelected((prev) => [...prev, course]);
  };

  const generateAi = () => {
    setAiLoading(true);

    setTimeout(() => {
      setAiLoading(false);
      setAiMessage(
        "현재 선택 과목 기준으로 공강과 수업일을 고려한 시간표를 찾았습니다.",
      );
    }, 700);
  };

  return (
    <div className="course-page">
      <aside className="course-sidebar">
        <div className="sidebar-title">수강신청</div>
        <div className="sidebar-subtitle">2026학년도 2학기</div>

        <nav className="sidebar-nav">
          <button className="active">
            <span>▦</span> 대시보드
          </button>
          <button>
            <span>⌕</span> 강의 검색
          </button>
          <button>
            <span>▣</span> 나의 시간표
          </button>
          <button>
            <span>✦</span> AI 시간표 추천
          </button>
          <button>
            <span>♡</span> 관심 강좌
          </button>
          <button>
            <span>✓</span> 신청 내역
          </button>
          <button>
            <span>i</span> 공지사항
          </button>
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
            <div className="heading-kicker">
              2026학년도 2학기 수강 신청
            </div>
            <h1>수강 신청</h1>
          </div>

          <div className="heading-status">
            <div>
              <span>수강 신청 현황</span>
              <strong>진행 중</strong>
            </div>
            <div>
              <span>남은 시간</span>
              <strong>01:25:34</strong>
            </div>
            <div>
              <span>신청 학점</span>
              <strong>{totalCredits}/18</strong>
            </div>
          </div>
        </section>

        <div className="content-grid">
          <section className="registration-panel panel">
            <div className="panel-title-row">
              <div>
                <h2>강좌명 신청</h2>
                <p>
                  원하는 강좌를 검색하고 시간표에 추가하세요.
                </p>
              </div>

              <button
                className="ai-mini-button"
                onClick={generateAi}
              >
                ✦ AI 추천
              </button>
            </div>

            <div className="search-box">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="강좌명 / 과목코드 검색"
              />

              <input
                value={professorKeyword}
                onChange={(e) => setProfessorKeyword(e.target.value)}
                placeholder="교수명 검색"
              />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as "all" | "major" | "general")}
              >
                <option value="all">전체 구분</option>
                <option value="major">전공</option>
                <option value="general">교양</option>
              </select>

              <button onClick={handleResetFilters}>초기화</button>
            </div>

            <div className="filter-row">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="전체 학년">전체 학년</option>
                <option value="1학년">1학년</option>
                <option value="2학년">2학년</option>
                <option value="3학년">3학년</option>
                <option value="4학년">4학년</option>
              </select>

              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="전체 요일">전체 요일</option>
                <option value="월">월</option>
                <option value="화">화</option>
                <option value="수">수</option>
                <option value="목">목</option>
                <option value="금">금</option>
              </select>
            </div>

            {(filterCategory === "all" || filterCategory === "major") && (
              <div className="filter-row">
                <select
                  value={selectedCollege}
                  onChange={(e) => {
                    setSelectedCollege(e.target.value);
                    setSelectedMajor("전체 전공");
                  }}
                >
                  <option value="전체 학부">전체 학부</option>
                  <option value="인문사회대학">인문사회대학</option>
                  <option value="경영대학">경영대학</option>
                  <option value="생명보건대학">생명보건대학</option>
                  <option value="AI·SW창의융합대학">AI·SW창의융합대학</option>
                  <option value="문화예술대학">문화예술대학</option>
                </select>

                {selectedCollege !== "전체 학부" && (
                  <select
                    value={selectedMajor}
                    onChange={(e) => setSelectedMajor(e.target.value)}
                  >
                    <option value="전체 전공">전체 전공</option>
                    {majors.map((major) => (
                      <option key={major} value={major}>
                        {major}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {(filterCategory === "all" || filterCategory === "general") && (
              <div className="filter-row">
                <select
                  value={selectedGeneralEducation}
                  onChange={(e) => {
                    setSelectedGeneralEducation(e.target.value);
                    setSelectedGeneralEducationArea("전체 영역");
                    setSelectedGeneralEducationElectiveArea("전체 영역");
                  }}
                >
                  <option value="전체 교양">전체 교양</option>
                  <option value="교필">교양 필수</option>
                  <option value="교필선">교양 필수 선택</option>
                  <option value="교선">교양 선택</option>
                </select>

                {selectedGeneralEducation === "교필선" && (
                  <select
                    value={selectedGeneralEducationArea}
                    onChange={(e) => setSelectedGeneralEducationArea(e.target.value)}
                  >
                    <option value="전체 영역">전체 영역</option>
                    <option value="심화글쓰기영역(글쓰기와토론영역)">심화글쓰기영역(글쓰기와토론영역)</option>
                    <option value="AIㆍSW교육영역(미래와기술영역)">AIㆍSW교육영역(미래와기술영역)</option>
                    <option value="글로벌의사소통영역1(언어)">글로벌의사소통영역1(언어)</option>
                    <option value="글로벌의사소통영역2(세계시민)">글로벌의사소통영역2(세계시민)</option>
                    <option value="취.창업실무영역(비전설계영역)">취.창업실무영역(비전설계영역)</option>
                    <option value="균형기초학문영역(균형학문영역)">균형기초학문영역(균형학문영역)</option>
                  </select>
                )}

                {selectedGeneralEducationArea === "균형기초학문영역(균형학문영역)" && (
                  <select
                    value={selectedGeneralEducationElectiveArea}
                    onChange={(e) => setSelectedGeneralEducationElectiveArea(e.target.value)}
                  >
                    <option value="전체 영역">전체 영역</option>
                    <option value="과학과 수리(자연과 과학)">과학과 수리(자연과 과학)</option>
                    <option value="경제와 사회(사회와 문화)">경제와 사회(사회와 문화)</option>
                    <option value="인문과 철학(인문과 예술)">인문과 철학(인문과 예술)</option>
                  </select>
                )}
              </div>
            )}

            <div className="course-table">
              <div className="table-head">
                <span>강좌명</span>
                <span>교수명</span>
                <span>요일/시간/강의실</span>
                <span>학점</span>
                <span>정원</span>
                <span>신청</span>
              </div>

              {filteredCourses.map((course) => {
                const isSelected = selected.some(
                  (item) => item.id === course.id,
                );

                const scheduleText = course.schedules
                  .map(
                    (schedule) =>
                      `${schedule.dayOfWeek} ${schedule.startPeriod}~${schedule.endPeriod}교시 (${schedule.classroom})`,
                  )
                  .join(", ");

                return (
                  <div
                    className={`course-row ${
                      isSelected ? "selected" : ""
                    }`}
                    key={course.id}
                  >
                    <div>
                      <b>{course.title}</b>
                      <small>
                        {course.courseCode} · {course.category}
                      </small>
                    </div>

                    <span>{course.professorName}</span>
                    <span>{scheduleText}</span>
                    <span>{course.credit} cr</span>

                    <span className="capacity">
                      {isSelected
                        ? "신청완료"
                        : `18/${course.capacity}`}
                    </span>

                    <button
                      className={isSelected ? "done" : "apply"}
                      onClick={() => toggleCourse(course)}
                    >
                      {isSelected ? "취소" : "신청"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="timetable-panel panel">
            <div className="panel-title-row">
              <div>
                <h2>주간 시간표</h2>
                <p>
                  현재 신청한 강좌를 기준으로 표시됩니다.
                </p>
              </div>

              <button className="outline-button">
                주간 새로고침
              </button>
            </div>

            <div className="timetable">
              <div className="time-labels">
                <div className="corner" />

                {periods.map((period) => (
                  <div key={period}>{period}교시</div>
                ))}
              </div>

              <div className="days-wrap">
                <div className="day-head">
                  {days.map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {days.map((day) => (
                    <div className="day-column" key={day}>
                      {periods.map((hour) => (
                        <div className="hour-cell" key={hour} />
                      ))}

                      {selected.flatMap((course) =>
                        course.schedules
                          .filter(
                            (schedule) =>
                              schedule.dayOfWeek === day,
                          )
                          .map((schedule) => (
                            <div
                              className="schedule-card"
                              key={`${course.id}-${schedule.id}`}
                              style={{
                                top: `${
                                  (schedule.startPeriod - 1) * 48 + 1
                                }px`,
                                height: `${
                                  (schedule.endPeriod -
                                    schedule.startPeriod +
                                    1) *
                                    48 -
                                  2
                                }px`,
                              }}
                            >
                              <b>{course.courseCode}</b>
                              <strong>{course.title}</strong>
                              <small>
                                {course.professorName}
                              </small>
                            </div>
                          )),
                      )}
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
              <div>
                <h2>수강 신청 목록</h2>
                <p>현재 선택한 강좌입니다.</p>
              </div>

              <strong className="credit-total">
                신청 총 학점: {totalCredits}학점
              </strong>
            </div>

            <div className="selected-list">
              {selected.map((course) => (
                <div className="selected-item" key={course.id}>
                  <span>{course.title}</span>
                  <small>
                    {course.courseCode} · {course.professorName}
                  </small>
                  <b>{course.credit}학점</b>
                </div>
              ))}
            </div>
          </div>

          <div className="ai-result panel">
            <div className="ai-badge">✦ AI COURSE PLANNER</div>

            <h2>AI가 시간표를 분석하고 있습니다.</h2>
            <p>{aiMessage}</p>

            <div className="ai-stats">
              <div>
                <span>현재 공강</span>
                <b>{5 - activeDaysCount}일</b>
              </div>

              <div>
                <span>수업일</span>
                <b>{activeDaysCount}일</b>
              </div>

              <div>
                <span>충돌</span>
                <b className="safe">0건</b>
              </div>
            </div>

            <button
              className="ai-main-button"
              onClick={generateAi}
              disabled={aiLoading}
            >
              {aiLoading
                ? "AI가 분석 중..."
                : "✦ 최적 시간표 추천받기"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}