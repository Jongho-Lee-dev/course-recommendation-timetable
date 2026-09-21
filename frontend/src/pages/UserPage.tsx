import { useState } from "react";
import { collegeMajors } from "../data/collegeMajors";
import { useUserStore } from "../store/userStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function UserPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("학년 선택");
  const [studentId, setStudentId] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [completedCredits, setCompletedCredits] = useState("");
  const [maxCredits, setMaxCredits] = useState("");
  const [graduationCredits, setGraduationCredits] = useState("");

  const majors = collegeMajors[selectedCollege] ?? [];

  const setUser = useUserStore((state) => state.setUser)

  const handleUserSave = () => {
    if (
      !name ||
      selectedGrade === "학년 선택" ||
      !studentId ||
      !selectedCollege ||
      !selectedMajor ||
      !completedCredits ||
      !maxCredits ||
      !graduationCredits
    ) {
      toast.error("모든 학생 정보를 입력해주세요.");
      return;
    }

    setUser({
      studentId,
      name,
      grade: Number(selectedGrade),
      completedCredits: Number(completedCredits),
      graduationCredits: Number(graduationCredits),
      maxCredits: Number(maxCredits),
      major: selectedMajor,
    });
    navigate("/mainPage");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafd] px-6">
      <div className="w-full max-w-3xl">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-[#5d6070]">
            수강신청 사이트
          </h1>
          <p className="mt-1 text-xs text-[#777a89]">
            수강신청에 필요한 학생 정보를 입력해주세요.
          </p>
        </div>

        <div className="rounded-xl border border-[#dddfe6] bg-white">
          <div className="border-b border-[#ececf0] px-5 py-4">
            <h2 className="text-sm font-bold text-[#5d6070]">
              학생 정보
            </h2>
            <p className="mt-1 text-[10px] text-[#a0a3b0]">
              입력한 정보를 바탕으로 맞춤형 과목을 추천받을 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 px-5 py-5 min-[701px]:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#5d6070]">
                이름
              </label>
              <input
                type="text"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none placeholder:text-[#a0a3b0] focus:border-[#a99aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#5d6070]">
                학년
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none transition focus:border-[#a99aed]"
              >
                <option value="학년 선택">학년 선택</option>
                <option value={1}>1학년</option>
                <option value={2}>2학년</option>
                <option value={3}>3학년</option>
                <option value={4}>4학년</option>
                <option value={5}>5학년</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#5d6070]">
                학번
              </label>
              <input
                type="text"
                placeholder="학번을 입력하세요"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none placeholder:text-[#a0a3b0] focus:border-[#a99aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#5d6070]">
                학과
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedCollege}
                  onChange={(e) => {
                    setSelectedCollege(e.target.value);
                    setSelectedMajor("");
                  }}
                  className="w-1/2 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none transition focus:border-[#a99aed]"
                >
                  <option value="">학부 선택</option>

                  {Object.keys(collegeMajors).map((college) => (
                    <option key={college} value={college}>
                      {college}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedMajor}
                  onChange={(e) => setSelectedMajor(e.target.value)}
                  disabled={!selectedCollege}
                  className="w-1/2 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none transition focus:border-[#a99aed] disabled:bg-[#fafafd] disabled:text-[#a0a3b0]"
                >
                  <option value="">학과 선택</option>

                  {majors.map((major) => (
                    <option key={major} value={major}>
                      {major}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#5d6070]">
                이수 학점
              </label>
              <input
                type="number"
                placeholder="예: 72"
                value={completedCredits}
                onChange={(e) => setCompletedCredits(e.target.value)}
                className="w-full rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none placeholder:text-[#a0a3b0] focus:border-[#a99aed]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-[#5d6070]">
                학기당 최대 신청 학점
              </label>
              <input
                type="number"
                placeholder="예: 18"
                value={maxCredits}
                onChange={(e) => setMaxCredits(e.target.value)}
                className="w-full rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none placeholder:text-[#a0a3b0] focus:border-[#a99aed]"
              />
            </div>

            <div className="min-[701px]:col-span-2">
              <label className="mb-1.5 block text-[11px] font-semibold text-[#5d6070]">
                졸업 필요 학점
              </label>
              <input
                type="number"
                placeholder="예: 130"
                value={graduationCredits}
                onChange={(e) => setGraduationCredits(e.target.value)}
                className="w-full rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none placeholder:text-[#a0a3b0] focus:border-[#a99aed]"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-[#ececf0] px-5 py-4">
            <button
              type="button"
              onClick={handleUserSave}
              className="rounded-md bg-[#7658e9] px-4 py-2 text-[10px] font-semibold text-white transition hover:bg-[#a99aed]"
            >
              저장하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}