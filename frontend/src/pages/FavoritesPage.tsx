import { useMemo, useState } from "react";
import { Heart, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CourseDetailModal from "../components/course/CourseDetailModal";
import { useCourseStore } from "../store/courseStore";
import type { CourseListItem } from "../types/database";
import { findConflict, getTotalCredits } from "../utils/courseRules";
import { useUserStore } from "../store/userStore";

export default function FavoritesPage(){
 const user=useUserStore(s=>s.user); const favorites=useCourseStore(s=>s.favorites), selected=useCourseStore(s=>s.selected); const toggleFavorite=useCourseStore(s=>s.toggleFavorite), toggleSelected=useCourseStore(s=>s.toggleSelected), clearFavorites=useCourseStore(s=>s.clearFavorites); const [keyword,setKeyword]=useState(""); const [category,setCategory]=useState("전체"); const [detail,setDetail]=useState<CourseListItem|null>(null);
 const filtered=useMemo(()=>favorites.filter(c=>(category==="전체"||c.category===category)&&(!keyword.trim()||`${c.title} ${c.courseCode} ${c.professorName}`.toLowerCase().includes(keyword.toLowerCase()))),[favorites,keyword,category]);
 const addAll=()=>{
   let count=0; let skipped=0; let workingCredits=getTotalCredits(selected);
   const working=[...selected];
   for(const course of filtered){
     if(working.some(s=>s.id===course.id)) continue;
     const conflict=working.find(s=>findConflict(s,course));
     if(conflict || workingCredits+course.credit>(user?.maxCredits??18) || working.length>=6){ skipped++; continue; }
     working.push(course); workingCredits+=course.credit; count++;
   }
   working.slice(selected.length).forEach(toggleSelected);
   if(count) toast.success(`${count}개 강의를 시간표에 추가했습니다.${skipped?` ${skipped}개는 충돌/학점 제한으로 제외되었습니다.`:""}`);
   else toast.info("추가할 수 있는 강의가 없습니다. 충돌 또는 학점 제한을 확인하세요.");
 };
 return <main className="mx-auto w-full max-w-[1500px] px-4 py-6 font-['Pretendard',sans-serif] text-[#20212b] min-[1101px]:px-7"><section className="overflow-hidden rounded-2xl border border-[#e3e4e9] bg-white shadow-[0_3px_14px_rgba(26,28,44,0.035)]"><header className="border-b border-[#ececf0] px-5 py-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0f5] text-[#df6070]"><Heart size={18} fill="currentColor"/></div><div><h1 className="text-sm font-extrabold">관심강좌</h1><p className="mt-1 text-[9px] text-[#9699a7]">수강 후보를 저장해두고 시간표에 빠르게 추가하세요.</p></div></div><span className="rounded-lg bg-[#f6f3ff] px-3 py-2 text-[9px] font-bold text-[#7658e9]">총 {favorites.length}개</span></div><div className="mt-5 flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0a3b0]"/><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="강좌명, 학수번호, 교수명 검색" className="w-full rounded-lg border border-[#dddfe6] py-2.5 pl-9 pr-3 text-[9px] outline-none focus:border-[#a99aed]"/></div>{["전체","전공","교양","마이크로디그리"].map(c=><button key={c} onClick={()=>setCategory(c)} className={`rounded-lg border px-3 py-2.5 text-[9px] font-semibold ${category===c?"border-[#7658e9] bg-[#7658e9] text-white":"border-[#dedfe5] bg-white text-[#777985]"}`}>{c}</button>)}<button onClick={addAll} disabled={!filtered.length} className="rounded-lg bg-[#7658e9] px-3 py-2.5 text-[9px] font-bold text-white disabled:bg-[#d8d6e3]">필터 결과 모두 추가</button><button onClick={()=>{if(favorites.length&&window.confirm("관심강좌를 모두 삭제할까요?"))clearFavorites();}} className="rounded-lg border border-[#dedfe5] px-3 py-2.5 text-[9px] text-[#777985]"><Trash2 size={12}/></button></div></header>
 {filtered.length===0?<div className="py-20 text-center"><Heart size={25} className="mx-auto text-[#d6d5dd]"/><p className="mt-4 text-[10px] font-semibold text-[#777985]">{favorites.length?"검색 조건에 맞는 관심강좌가 없습니다.":"아직 저장한 관심강좌가 없습니다."}</p><p className="mt-1 text-[9px] text-[#a0a3ae]">강의 검색에서 하트 버튼을 눌러 저장할 수 있습니다.</p></div>:<div>{filtered.map(course=>{const added=selected.some(c=>c.id===course.id);return <div key={course.id} className="flex flex-wrap items-center gap-4 border-b border-[#f0f0f3] px-5 py-4"><button onClick={()=>setDetail(course)} className="min-w-[220px] flex-1 text-left"><span className="text-[8px] text-[#9699a7]">{course.courseCode} · {course.courseType??course.category}</span><b className="mt-1 block text-[10px] hover:text-[#7658e9]">{course.title}</b><span className="mt-1 block text-[8px] text-[#9699a7]">{course.professorName} · {course.credit}학점 · {course.isOnline?"온라인":course.schedules.map(s=>`${s.dayOfWeek} ${s.startPeriod}-${s.endPeriod}`).join(" / ")}</span></button><span className="rounded-md bg-[#fafafd] px-2.5 py-1.5 text-[8px] text-[#777985]">{course.capacity}명 정원</span><button onClick={()=>toggleSelected(course)} className={`rounded-lg px-3 py-2 text-[9px] font-bold ${added?"bg-[#ececf1] text-[#70727f]":"bg-[#7658e9] text-white"}`}>{added?"시간표에서 제거":"시간표 추가"}</button><button onClick={()=>toggleFavorite(course)} className="rounded-lg border border-[#dedfe5] p-2 text-[#df6070]" aria-label="관심 해제"><Heart size={13} fill="currentColor"/></button></div>})}</div>}</section>{detail&&<CourseDetailModal course={detail} isFavorite onClose={()=>setDetail(null)} onToggleFavorite={()=>toggleFavorite(detail)} isSelected={selected.some(c=>c.id===detail.id)} onToggleSelected={()=>toggleSelected(detail)}/>}</main>;
}
