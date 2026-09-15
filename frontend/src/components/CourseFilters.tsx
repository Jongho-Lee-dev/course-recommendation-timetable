
import type { Dispatch, SetStateAction } from "react";
import { collegeMajors } from "../data/collegeMajors";

type FilterCategory = "all" | "major" | "general";

type CourseFiltersProps = {
  keyword: string;
  setKeyword: Dispatch<SetStateAction<string>>;

  professorKeyword: string;
  setProfessorKeyword: Dispatch<SetStateAction<string>>;

  filterCategory: FilterCategory;
  setFilterCategory: Dispatch<SetStateAction<FilterCategory>>;

  selectedGrade: string;
  setSelectedGrade: Dispatch<SetStateAction<string>>;

  selectedDay: string;
  setSelectedDay: Dispatch<SetStateAction<string>>;

  selectedCollege: string;
  setSelectedCollege: Dispatch<SetStateAction<string>>;

  selectedMajor: string;
  setSelectedMajor: Dispatch<SetStateAction<string>>;

  selectedGeneralEducation: string;
  setSelectedGeneralEducation: Dispatch<SetStateAction<string>>;

  selectedGeneralEducationArea: string;
  setSelectedGeneralEducationArea: Dispatch<SetStateAction<string>>;

  selectedGeneralEducationElectiveArea: string;
  setSelectedGeneralEducationElectiveArea: Dispatch<
    SetStateAction<string>
  >;

  onReset: () => void;
};

const selectClassName =
  "min-w-[90px] rounded-md border border-[#dddfe6] bg-white px-[9px] py-2 text-[10px] text-[#5d6070] outline-none transition focus:border-[#a99aed]";

const inputClassName =
  "min-w-0 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none placeholder:text-[#a0a3b0] focus:border-[#a99aed]";

export default function CourseFilters({
  keyword,
  setKeyword,
  professorKeyword,
  setProfessorKeyword,
  filterCategory,
  setFilterCategory,
  selectedGrade,
  setSelectedGrade,
  selectedDay,
  setSelectedDay,
  selectedCollege,
  setSelectedCollege,
  selectedMajor,
  setSelectedMajor,
  selectedGeneralEducation,
  setSelectedGeneralEducation,
  selectedGeneralEducationArea,
  setSelectedGeneralEducationArea,
  selectedGeneralEducationElectiveArea,
  setSelectedGeneralEducationElectiveArea,
  onReset,
}: CourseFiltersProps) {
  const majors = collegeMajors[selectedCollege] ?? [];

  return (
    <div className="space-y-3 px-[18px] py-4">
      <div className="grid grid-cols-1 gap-2 min-[701px]:grid-cols-2">
        <input
          className={inputClassName}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="강좌명 또는 학수번호 검색"
        />

        <input
          className={inputClassName}
          value={professorKeyword}
          onChange={(e) => setProfessorKeyword(e.target.value)}
          placeholder="교수명 검색"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${
            filterCategory === "all"
              ? "bg-[#7658e9] text-white"
              : "border border-[#dddfe6] bg-white text-[#777a89]"
          }`}
          onClick={() => setFilterCategory("all")}
        >
          전체
        </button>

        <button
          type="button"
          className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${
            filterCategory === "major"
              ? "bg-[#7658e9] text-white"
              : "border border-[#dddfe6] bg-white text-[#777a89]"
          }`}
          onClick={() => setFilterCategory("major")}
        >
          전공
        </button>

        <button
          type="button"
          className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${
            filterCategory === "general"
              ? "bg-[#7658e9] text-white"
              : "border border-[#dddfe6] bg-white text-[#777a89]"
          }`}
          onClick={() => setFilterCategory("general")}
        >
          교양
        </button>

        <button
          type="button"
          className="ml-auto rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#777a89] transition hover:bg-[#fafafd]"
          onClick={onReset}
        >
          초기화
        </button>
      </div>

      <div className="flex flex-wrap gap-[6px]">
        {filterCategory !== "general" && (
          <>
            <select
              className={selectClassName}
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
              className={selectClassName}
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
          </>
        )}

        {/* 전공 필터 */}
        {(filterCategory === "all" || filterCategory === "major") && (
          <div className="flex flex-wrap gap-[6px]">
            <select
              className={selectClassName}
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
              <option value="AI·SW창의융합대학">
                AI·SW창의융합대학
              </option>
              <option value="문화예술대학">문화예술대학</option>
            </select>

            {selectedCollege !== "전체 학부" && (
              <select
                className={selectClassName}
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

        {/* 교양 필터 */}
        {(filterCategory === "all" || filterCategory === "general") && (
          <div className="flex flex-wrap gap-[6px]">
            <select
              className={selectClassName}
              value={selectedGeneralEducation}
              onChange={(e) => {
                setSelectedGeneralEducation(e.target.value);
                setSelectedGeneralEducationArea("전체 영역");
                setSelectedGeneralEducationElectiveArea("전체 영역");
              }}
            >
              <option value="전체 교양">전체 교양</option>
              <option value="교양 필수">교양 필수</option>
              <option value="교양 필수 선택">교양 필수 선택</option>
              <option value="교양 선택">교양 선택</option>
            </select>

            {selectedGeneralEducation === "교양 필수 선택" && (
              <select
                className={selectClassName}
                value={selectedGeneralEducationArea}
                onChange={(e) => {
                  setSelectedGeneralEducationArea(e.target.value);
                  setSelectedGeneralEducationElectiveArea("전체 영역");
                }}
              >
                <option value="전체 영역">전체 영역</option>
                <option value="심화글쓰기영역(글쓰기와토론영역)">
                  심화글쓰기영역(글쓰기와토론영역)
                </option>
                <option value="AIㆍSW교육영역(미래와기술영역)">
                  AIㆍSW교육영역(미래와기술영역)
                </option>
                <option value="글로벌의사소통영역1(언어)">
                  글로벌의사소통영역1(언어)
                </option>
                <option value="글로벌의사소통영역2(세계시민)">
                  글로벌의사소통영역2(세계시민)
                </option>
                <option value="취.창업실무영역(비전설계영역)">
                  취.창업실무영역(비전설계영역)
                </option>
                <option value="균형기초학문영역(균형학문영역)">
                  균형기초학문영역(균형학문영역)
                </option>
              </select>
            )}

            {selectedGeneralEducationArea ===
              "균형기초학문영역(균형학문영역)" && (
              <select
                className={selectClassName}
                value={selectedGeneralEducationElectiveArea}
                onChange={(e) =>
                  setSelectedGeneralEducationElectiveArea(e.target.value)
                }
              >
                <option value="전체 영역">전체 영역</option>
                <option value="과학과 수리(자연과 과학)">
                  과학과 수리(자연과 과학)
                </option>
                <option value="경제와 사회(사회와 문화)">
                  경제와 사회(사회와 문화)
                </option>
                <option value="인문과 철학(인문과 예술)">
                  인문과 철학(인문과 예술)
                </option>
              </select>
            )}
          </div>
        )}
      </div>
    </div>
  );
}