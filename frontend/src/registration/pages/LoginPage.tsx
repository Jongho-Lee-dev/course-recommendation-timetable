import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUserStore } from "../store/userStore";

import { api } from "../../shared/api";
import { toUser, type StudentProfile } from "../../shared/studentSession";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafd] px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-bold text-[#5d6070]">
          수강신청 사이트
          </h1>
        <p className="mb-5 mt-1 text-xs text-[#777a89]">
          학번과 비밀번호로 로그인해 주세요.
          </p>
        <form className="rounded-xl border border-[#dddfe6] bg-white" onSubmit={async (event) => {
          event.preventDefault();
          if (!studentId.trim() || !password) {
            toast.error("학번과 비밀번호를 입력해 주세요.");
            return;
          }
          
          if (busy) return;
          setBusy(true);
          try {
            const result = await api<{token:string;student:StudentProfile}>("/auth/login", {method:"POST",body:JSON.stringify({studentId:studentId.trim(),password})});
            sessionStorage.setItem("student-token",result.token);
            setUser(toUser(result.student));
            navigate("/mainPage", { replace: true });
          } catch(e) { toast.error(e instanceof Error ? e.message : "로그인 실패"); }
          finally { setBusy(false); }
        }}>
          <h2 className="border-b border-[#ececf0] px-5 py-4 text-sm font-bold text-[#5d6070]">
            로그인
            </h2>
          <div className="space-y-4 p-5">
            <div>
              <label htmlFor="login-student-id" className="mb-1.5 block text-xs font-semibold text-[#5d6070]">
                학번
                </label>
              <input id="login-student-id" autoComplete="username" required value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="학번을 입력하세요" className="w-full rounded-md border border-[#dddfe6] px-3 py-2.5 text-xs outline-none focus:border-[#a99aed]" />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-[#5d6070]">
                비밀번호
                </label>
              <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="비밀번호를 입력하세요" className="w-full rounded-md border border-[#dddfe6] px-3 py-2.5 text-xs outline-none focus:border-[#a99aed]" />
            </div>
            <button disabled={busy} type="submit" className="w-full rounded-md bg-[#7658e9] py-2.5 text-xs font-semibold text-white transition hover:bg-[#a99aed]">
              로그인
              </button>
          </div>
          <p className="border-t border-[#ececf0] px-5 py-4 text-center text-xs text-[#777a89]">
            아직 계정이 없으신가요? 
            <Link to="/signup" className="ml-2 font-semibold text-[#7658e9] hover:underline">회원가입</Link></p>
        </form>
      </div>
    </div>
  );
}
