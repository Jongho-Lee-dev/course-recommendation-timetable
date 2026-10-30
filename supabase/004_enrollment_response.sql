-- 003 적용 후 추가 실행. 테이블과 기존 신청 기록을 변경하지 않습니다.
begin;


create or replace function public.tt_enrollment_state(p_owner uuid) returns jsonb language sql volatile
set search_path=public as $$
 with counts as (
  select "openCourseId",count(*)::int n from tt_enrollments where status='enrolled' group by "openCourseId"
 ), schedules as (
  select "openCourseId",jsonb_agg(jsonb_build_object('id',id,'openCourseId',"openCourseId",'dayOfWeek',"dayOfWeek",'startPeriod',"startPeriod",'endPeriod',"endPeriod",'classroom',classroom) order by id) data
  from tt_schedules group by "openCourseId"
 ), catalog as (
  select o.id,o.active,jsonb_strip_nulls(jsonb_build_object(
   'id',o.id,'courseCode',o."courseCode",'sectionNo',o."sectionNo",'title',c.title,'credit',c.credit,
   'professorName',o."professorName",'capacity',o.capacity,'targetGrade',o."targetGrade",'departmentId',o."departmentId",
   'isOnline',o."isOnline",'classificationPath',o."classificationPath",'excludedDepartmentIds',o."excludedDepartmentIds",'active',o.active,
   'category',o."classificationPath"[1],'courseType',o."classificationPath"[2],
   'generalEducationArea',coalesce(o."classificationPath"[3],''),'generalEducationElectiveArea',coalesce(o."classificationPath"[4],''),
   'majorName',d."majorName",'facultyName',d."facultyName",'collegeName',d."collegeName",
   'schedules',coalesce(s.data,'[]'::jsonb),'enrolledCount',coalesce(n.n,0),'remainingSeats',greatest(0,o.capacity-coalesce(n.n,0))
  )) item
  from tt_open_courses o join tt_courses c on c."courseCode"=o."courseCode" join tt_departments d on d.id=o."departmentId"
  left join counts n on n."openCourseId"=o.id left join schedules s on s."openCourseId"=o.id
 )
 select jsonb_build_object(
  'studentId',(select "studentId" from tt_students where owner=p_owner),
  'courses',coalesce((select jsonb_agg(item order by id) from catalog where active),'[]'::jsonb),
  'enrolled',coalesce((select jsonb_agg(c.item order by c.id) from catalog c join tt_enrollments e on e."openCourseId"=c.id where e."studentOwner"=p_owner and e.status='enrolled'),'[]'::jsonb)
 )
$$;


create or replace function public.tt_apply_enrollments(p_owner uuid,
                                    p_course_ids bigint[],p_action text) returns jsonb language plpgsql
set search_path=public as $$
begin
 perform public.tt_change_enrollments(p_owner,p_course_ids,p_action);
 return public.tt_enrollment_state(p_owner);
end $$;

revoke all on function public.tt_enrollment_state(uuid)
from public,anon,authenticated;

revoke all on function public.tt_apply_enrollments(uuid,bigint[],text)
from public,anon,authenticated;

grant execute on function public.tt_enrollment_state(uuid) to service_role;

grant execute on function public.tt_apply_enrollments(uuid,bigint[],text) to service_role;

notify pgrst,'reload schema';


commit;
