import { ArrowLeft, GraduationCap, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-[#ececf2] bg-[#fafafd] px-4 py-3.5">
      <p className="text-[11px] font-semibold text-[#9294a2]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-bold text-[#292a3b]">
        {value || "-"}
      </p>
    </div>
  );
}

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6">
        <div className="rounded-2xl border border-[#e5e6ed] bg-white p-8 text-center">
          <p className="font-bold">로그인이 필요합니다.</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-[#7560e8] px-4 py-2 text-sm font-bold text-white"
            onClick={() => navigate("/")}
          >
            로그인으로 이동
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-7 text-[#252638] sm:px-7">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#77798a] hover:text-[#6651d8]"
      >
        <ArrowLeft size={15} /> 이전 페이지
      </button>

      <div className="mb-6 flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eeeaff] text-[#765fe7]">
          <UserRound size={22} />
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#8979e6]">
            MY ACCOUNT
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            내 정보
          </h1>
          <p className="mt-2 text-sm text-[#858797]">
            등록된 개인정보와 학점 정보를 확인할 수 있습니다.
          </p>
        </div>

        <span className="ml-auto rounded-full bg-[#f0edff] px-3 py-1.5 text-[10px] font-bold text-[#7560e8]">
          조회 전용
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-2xl border border-[#e6e7ee] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 border-b border-[#f0f0f4] pb-4">
            <h2 className="text-sm font-extrabold">기본 정보</h2>
            <p className="mt-1 text-xs text-[#9294a2]">
              현재 계정에 등록된 학생 정보입니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem label="이름" value={user.name} />
            <InfoItem label="학번" value={user.studentId} />
            <InfoItem label="학년" value={`${user.grade}학년`} />
            <InfoItem label="학과" value={user.major} />
            {user.collegeName && (
              <InfoItem label="단과대학" value={user.collegeName} />
            )}
            {user.facultyName && (
              <InfoItem label="학부" value={user.facultyName} />
            )}
          </div>

          <div className="mb-5 mt-9 flex items-center gap-2 border-b border-[#f0f0f4] pb-4">
            <GraduationCap size={18} className="text-[#7560e8]" />
            <div>
              <h2 className="text-sm font-extrabold">학점 정보</h2>
              <p className="mt-1 text-xs text-[#9294a2]">
                시간표 추천과 수강 신청 가능 학점 계산에 사용됩니다.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e8e4ff] bg-[#faf9ff] p-4">
              <p className="text-[11px] font-semibold text-[#85819e]">
                현재 이수 학점
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#7560e8]">
                {user.completedCredits}
                <span className="ml-1 text-xs font-semibold">학점</span>
              </p>
            </div>

            <div className="rounded-xl border border-[#ececf2] bg-[#fafafd] p-4">
              <p className="text-[11px] font-semibold text-[#9294a2]">
                졸업 필요 학점
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#292a3b]">
                {user.graduationCredits}
                <span className="ml-1 text-xs font-semibold">학점</span>
              </p>
            </div>

            <div className="rounded-xl border border-[#ececf2] bg-[#fafafd] p-4">
              <p className="text-[11px] font-semibold text-[#9294a2]">
                최대 신청 학점
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#292a3b]">
                {user.maxCredits}
                <span className="ml-1 text-xs font-semibold">학점</span>
              </p>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-[#e6e7ee] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#eeeaff] text-sm font-extrabold text-[#7560e8]">
              {user.name.slice(0, 1) || "학"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{user.name}</p>
              <p className="mt-1 truncate text-[11px] text-[#8a8c9a]">
                {user.major} · {user.grade}학년
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-[#f0f0f4] pt-4 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-[#8a8c9a]">학번</span>
              <strong>{user.studentId}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#8a8c9a]">이수 학점</span>
              <strong>{user.completedCredits}학점</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#8a8c9a]">졸업 필요</span>
              <strong>{user.graduationCredits}학점</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-[#8a8c9a]">신청 상한</span>
              <strong>{user.maxCredits}학점</strong>
            </div>
          </div>

          <p className="mt-5 rounded-xl bg-[#f7f6ff] p-3 text-[11px] leading-5 text-[#756aab]">
            이 페이지에서는 개인정보와 학점 정보를 조회할 수 있습니다.
            정보 변경이 필요한 경우 학교의 공식 학사 시스템을 이용해 주세요.
          </p>

          <button
            type="button"
            onClick={() => navigate("/mainPage")}
            className="mt-4 w-full rounded-xl border border-[#e2e3eb] px-4 py-3 text-xs font-bold text-[#6e7080] hover:bg-[#f8f8fb]"
          >
            대시보드로 돌아가기
          </button>
        </aside>
      </div>
    </main>
  );
}
