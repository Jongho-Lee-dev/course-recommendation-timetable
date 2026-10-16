import { useCourseStore } from "./registration/store/courseStore";
import { useUserStore } from "./registration/store/userStore";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import { api } from "./shared/api";
import { toUser, type StudentProfile } from "./shared/studentSession";
import { useCourseCatalogStore } from "./shared/store/courseCatalogStore";
import type { CourseListItem } from "./shared/types/database";
export default function App() {
  const studentId = useUserStore(s=>s.user?.studentId);
  const [error,setError] = useState("");
  const [ready,setReady] = useState(false);
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    if (!sessionStorage.getItem("student-token")) useUserStore.getState().reset();
    else void api<StudentProfile>("/students/me", {}, "student").then(student => {
      if (sessionStorage.getItem("student-token")) useUserStore.getState().setUser(toUser(student));
    }).catch(() => useUserStore.getState().reset());
  },[]);
  useEffect(() => {
    let active=true;
    api<CourseListItem[]>("/courses").then(courses => {
      if (!active) return;
      useCourseCatalogStore.getState().setCourses(courses);
      setReady(true); setError("");
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : "서버 연결 실패"); });
    return () => {active=false;};
  },[retry]);
  useEffect(() => {
    let active=true;
    let running=false;
    const refresh = async (notify=false) => {
      if (running || useCourseStore.getState().enrollmentBusy) return;
      running=true;
      try {
        if (studentId && sessionStorage.getItem("student-token")) {
          await useCourseStore.getState().loadEnrollments();
        } else {
          if (!studentId) useCourseStore.setState({selected:[],history:[]});
          const courses=await api<CourseListItem[]>("/courses");
          if (active && !useCourseStore.getState().enrollmentBusy) useCourseCatalogStore.getState().setCourses(courses);
        }
      } catch(e) {
        if (active && notify) {
          useCourseStore.setState({selected:[],history:[]});
          toast.error(e instanceof Error ? e.message : "신청내역을 불러오지 못했습니다.");
        }
      } finally {running=false;}
    };
    void refresh(true);
    const timer=window.setInterval(()=>{void refresh();},5000);
    return () => {active=false;window.clearInterval(timer);};
  },[studentId]);
  if (error) return <main className="p-8"><p role="alert">{error}</p><button onClick={() => setRetry(retry+1)}>다시 연결</button></main>;
  if (!ready) return <main className="p-8">과목 목록을 불러오는 중입니다…</main>;
  return <AppRoutes />;
}
