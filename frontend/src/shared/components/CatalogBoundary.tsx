import { useCourseCatalogStore } from "../store/courseCatalogStore";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { useCourseStore } from "../../registration/store/courseStore";
import { useUserStore } from "../../registration/store/userStore";

export default function CatalogBoundary({ children }: { children: ReactNode }) {
  const { data, error, isPending, isError, isFetching, refetch, dataUpdatedAt } = useCatalog();
  const courses = useCourseCatalogStore(state => state.courses);
  const loaded = useCourseCatalogStore(state => state.loaded);
  const syncCatalog = useCourseStore(state => state.syncCatalog);
  useEffect(() => {
    if (!data) return;
    useCourseCatalogStore.getState().setCourses(data.courses);
    // 이전 브라우저 저장 정보에도 DB의 학과 번호를 적용합니다.
    const user = useUserStore.getState().user;
    const department = data.departments.find(item => item.majorName === user?.major);
    if (user && department && user.departmentId !== department.id) {
      useUserStore.getState().setUser({ ...user, departmentId: department.id,
        collegeName: department.collegeName, facultyName: department.facultyName });
    }
  }, [data, dataUpdatedAt]);
  useEffect(() => { if (loaded) syncCatalog(courses); }, [courses, loaded, syncCatalog]);

  if (isPending) return <div role="status" className="grid min-h-screen place-items-center text-sm text-[#777985]">강의와 학과 정보를 불러오는 중입니다…</div>;
  if (isError) return <div role="alert" className="grid min-h-screen place-items-center bg-[#fafafd] p-6">
    <div className="max-w-lg rounded-xl border border-[#e3e4e9] bg-white p-6">
      <h1 className="text-base font-bold">강의 정보를 불러오지 못했습니다.</h1>
      <p className="mt-3 text-sm text-[#777985]">{error instanceof Error ? error.message : "백엔드 연결을 확인하세요."}</p>
      <p className="mt-2 text-xs text-[#777985]">백엔드 서버를 실행한 뒤 다시 시도하세요.</p>
      <button disabled={isFetching} onClick={() => void refetch()} className="mt-4 rounded-lg bg-[#7658e9] px-4 py-2 text-sm text-white disabled:opacity-50">{isFetching ? "연결 중…" : "다시 시도"}</button>
    </div>
  </div>;
  if (!loaded) return <div role="status">강의 정보를 준비하고 있습니다…</div>;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e4e9] bg-white px-5 py-2 text-xs text-[#777985]">
      <span>개설 강의 {data?.courses.length ?? 0}개 · 시간표와 관심강좌는 이 브라우저에 저장됩니다.</span>
      <button disabled={isFetching} onClick={() => void refetch()} className="rounded border border-[#dedfe5] px-3 py-1 disabled:opacity-50">{isFetching ? "새로고침 중…" : "강의 정보 새로고침"}</button>
    </div>
    {children}
  </>;
}
