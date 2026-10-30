-- 기존 001/002 설치 후 이 파일만 한 번 실행하세요. 기존 학생/과목은 삭제하지 않습니다.
begin;


create table if not exists public.tt_enrollments (id bigint generated always as identity primary key,
                                                                                         "studentOwner" uuid not null references public.tt_students(owner),
                                                                                                                                 "openCourseId" bigint not null references public.tt_open_courses(id),
                                                                                                                                                                           status text not null default 'enrolled' check(status in ('enrolled',

                                                                                                                                                                                                                                'cancelled')),
                                                                                                                                                                                                                   "createdAt" timestamptz not null default now(),
                                                                                                                                                                                                                                                            "updatedAt" timestamptz not null default now(),
                                                                                                                                                                                                                                                                                                     unique("studentOwner",

                                                                                                                                                                                                                                                                                                       "openCourseId"));


create index if not exists tt_enrollments_course_status on public.tt_enrollments("openCourseId",
                                                                    status);


alter table public.tt_enrollments enable row level security;

revoke all on public.tt_enrollments
from anon,authenticated;

grant all on public.tt_enrollments to service_role;

grant usage,
select on sequence public.tt_enrollments_id_seq to service_role;

-- SQL Editor에서 신청 인원과 잔여석을 확인할 수 있는 읽기 전용 뷰

create or replace view public.tt_course_seats with (security_invoker=true) as
select o.id as "openCourseId",o."courseCode",o."sectionNo",o.capacity, count(e.id)::int as "enrolledCount",
       greatest(0, o.capacity-count(e.id))::int as "remainingSeats"
from public.tt_open_courses o
left join public.tt_enrollments e on e."openCourseId"=o.id
and e.status='enrolled'
group by o.id;

revoke all on public.tt_course_seats
from anon,authenticated;

grant
select on public.tt_course_seats to service_role;


create or replace function public.tt_enrollment_snapshot(p_owner uuid default null) returns jsonb language sql stable
set search_path=public as $$
 select jsonb_build_object(
  'counts',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'enrolledCount',(select count(*) from tt_enrollments e where e."openCourseId"=o.id and e.status='enrolled'))) from tt_open_courses o),'[]'::jsonb),
  'courseIds',coalesce((select jsonb_agg(e."openCourseId" order by e.id) from tt_enrollments e where e."studentOwner"=p_owner and e.status='enrolled'),'[]'::jsonb)
 )
$$;


create or replace function public.tt_change_enrollments(p_owner uuid,
                                    p_course_ids bigint[],p_action text) returns void language plpgsql
set search_path=public as $$
declare student tt_students%rowtype; course tt_open_courses%rowtype; cid bigint;
begin
 -- 과목 관리 RPC와 같은 잠금: 정원 수정/신청/취소가 서로 엇갈리지 않습니다.
 -- 시연 규모에 맞춰 전체 신청을 직렬 처리합니다. 대규모 운영용 대기열은 별도 범위입니다.
 perform pg_advisory_xact_lock(20261014);
 select * into student from tt_students where owner=p_owner for update;
 if not found then raise exception using errcode='P0001',message='학생 정보가 없습니다. 학생 정보를 먼저 등록하세요.'; end if;
 if p_action not in ('add','cancel','replace') or p_action is null then raise exception '잘못된 신청 동작입니다.'; end if;
 if p_course_ids is null or array_position(p_course_ids,null) is not null or cardinality(p_course_ids)>100 then raise exception '잘못된 강좌 목록입니다.'; end if;
 if p_action='cancel' then
  update tt_enrollments set status='cancelled',"updatedAt"=now() where "studentOwner"=p_owner and "openCourseId"=any(p_course_ids) and status='enrolled';
  return;
 end if;
 if p_action='replace' then
  update tt_enrollments set status='cancelled',"updatedAt"=now() where "studentOwner"=p_owner and not("openCourseId"=any(p_course_ids)) and status='enrolled';
 end if;
 for cid in select distinct x from unnest(p_course_ids) x order by x loop
  -- 동일 요청 재전송은 추가 집계하지 않습니다.
  if exists(select 1 from tt_enrollments where "studentOwner"=p_owner and "openCourseId"=cid and status='enrolled') then continue; end if;
  select * into course from tt_open_courses where id=cid and active;
  if not found then raise exception '신청할 수 없는 강좌입니다.'; end if;
  if student."departmentId"=any(course."excludedDepartmentIds") then raise exception '소속 학과가 수강 제외 대상입니다.'; end if;
  if (select count(*) from tt_enrollments where "openCourseId"=cid and status='enrolled')>=course.capacity then raise exception '수강 정원이 마감되었습니다.'; end if;
  insert into tt_enrollments("studentOwner","openCourseId",status) values(p_owner,cid,'enrolled')
   on conflict("studentOwner","openCourseId") do update set status='enrolled',"updatedAt"=now();
 end loop;
 if (select coalesce(sum(c.credit),0) from tt_enrollments e join tt_open_courses o on o.id=e."openCourseId" join tt_courses c on c."courseCode"=o."courseCode" where e."studentOwner"=p_owner and e.status='enrolled')>student."maxCredits" then raise exception '최대 신청 학점을 초과합니다.'; end if;
 if exists(select 1 from tt_enrollments e join tt_open_courses o on o.id=e."openCourseId" where e."studentOwner"=p_owner and e.status='enrolled' group by o."courseCode" having count(*)>1) then raise exception '같은 과목의 다른 분반을 중복 신청할 수 없습니다.'; end if;
 if exists(
  select 1 from tt_enrollments a join tt_enrollments b on a."studentOwner"=b."studentOwner" and a."openCourseId"<b."openCourseId"
  join tt_open_courses oa on oa.id=a."openCourseId" join tt_open_courses ob on ob.id=b."openCourseId"
  join tt_schedules sa on sa."openCourseId"=oa.id join tt_schedules sb on sb."openCourseId"=ob.id
  where a."studentOwner"=p_owner and a.status='enrolled' and b.status='enrolled' and not oa."isOnline" and not ob."isOnline"
  and sa."dayOfWeek"=sb."dayOfWeek" and sa."startPeriod"<=sb."endPeriod" and sa."endPeriod">=sb."startPeriod"
 ) then raise exception '이미 신청한 강좌와 시간이 겹칩니다.'; end if;
end $$;

revoke all on function public.tt_enrollment_snapshot(uuid)
from public,anon,authenticated;

revoke all on function public.tt_change_enrollments(uuid,bigint[],text)
from public,anon,authenticated;

grant execute on function public.tt_enrollment_snapshot(uuid) to service_role;

grant execute on function public.tt_change_enrollments(uuid,bigint[],text) to service_role;


create or replace function public.tt_save_catalog(items jsonb,
                                    replace_all boolean default false,
                                    edit_id bigint default null) returns void language plpgsql
set search_path=public as $$
declare c jsonb; s jsonb; course_id bigint; seen bigint[] := '{}';
begin
 perform pg_advisory_xact_lock(20261014);
 if jsonb_array_length(items)=0 then raise exception 'Empty catalog'; end if;
 if edit_id > 0 and (jsonb_array_length(items)<>1 or not exists(select 1 from tt_open_courses where id=edit_id and active)) then raise exception 'Invalid edit id'; end if;
 if exists(select 1 from jsonb_array_elements(items) x group by x->>'courseCode',x->>'sectionNo' having count(*)>1) then raise exception 'Duplicate course key'; end if;
 for c in select * from jsonb_array_elements(items) loop
  if exists(select 1 from jsonb_array_elements_text(c->'excludedDepartmentIds') x where not exists(select 1 from tt_departments where id=x::bigint)) then raise exception 'Unknown excluded department'; end if;
  -- 신청자가 있는 강좌의 학사 정보는 동결합니다. 정원/표시명 수정은 가능합니다.
  if exists(select 1 from tt_enrollments e join tt_open_courses o on o.id=e."openCourseId" where e.status='enrolled' and o."courseCode"=c->>'courseCode') and
     exists(select 1 from tt_courses where "courseCode"=c->>'courseCode' and credit<>(c->>'credit')::numeric) then raise exception '신청자가 있는 과목의 학점은 수정할 수 없습니다.'; end if;
  select id into course_id from tt_open_courses where (edit_id>0 and id=edit_id) or ("courseCode"=c->>'courseCode' and "sectionNo"=c->>'sectionNo') limit 1;
  if course_id is not null and exists(select 1 from tt_enrollments where "openCourseId"=course_id and status='enrolled') then
   if (c->>'capacity')::int<(select count(*) from tt_enrollments where "openCourseId"=course_id and status='enrolled') then raise exception '정원을 현재 신청 인원보다 줄일 수 없습니다.'; end if;
   if exists(select 1 from tt_open_courses o where o.id=course_id and (
    o."courseCode"<>c->>'courseCode' or o."departmentId"<>(c->>'departmentId')::bigint or o."isOnline"<>(c->>'isOnline')::boolean or
    to_jsonb(o."excludedDepartmentIds")<>c->'excludedDepartmentIds'
   )) or (select coalesce(jsonb_agg(jsonb_build_object('dayOfWeek',t."dayOfWeek",'startPeriod',t."startPeriod",'endPeriod',t."endPeriod",'classroom',t.classroom) order by t."dayOfWeek",t."startPeriod",t."endPeriod",t.classroom),'[]'::jsonb) from tt_schedules t where t."openCourseId"=course_id)
   <> (select coalesce(jsonb_agg(x order by x->>'dayOfWeek',(x->>'startPeriod')::int,(x->>'endPeriod')::int,x->>'classroom'),'[]'::jsonb) from jsonb_array_elements(c->'schedules') x)
   then raise exception '신청자가 있는 강좌의 학수번호·학과·수업시간·제외 대상은 먼저 신청을 취소한 후 수정하세요.'; end if;
  end if;
  insert into tt_courses("courseCode",title,credit) values(c->>'courseCode',c->>'title',(c->>'credit')::numeric)
  on conflict("courseCode") do update set title=excluded.title,credit=excluded.credit;
  if edit_id = 0 and exists(select 1 from tt_open_courses where "courseCode"=c->>'courseCode' and "sectionNo"=c->>'sectionNo') then raise exception 'Duplicate course key'; end if;
  if edit_id > 0 then
   update tt_open_courses set "courseCode"=c->>'courseCode',"sectionNo"=c->>'sectionNo' where id=edit_id;
  end if;
  insert into tt_open_courses("courseCode","sectionNo","professorName",capacity,"targetGrade","departmentId","isOnline","classificationPath","excludedDepartmentIds")
  values(c->>'courseCode',c->>'sectionNo',c->>'professorName',(c->>'capacity')::int,(c->>'targetGrade')::int,(c->>'departmentId')::bigint,(c->>'isOnline')::boolean,
   array(select jsonb_array_elements_text(c->'classificationPath')),array(select jsonb_array_elements_text(c->'excludedDepartmentIds')::bigint))
  on conflict("courseCode","sectionNo") do update set "professorName"=excluded."professorName",capacity=excluded.capacity,"targetGrade"=excluded."targetGrade","departmentId"=excluded."departmentId","isOnline"=excluded."isOnline","classificationPath"=excluded."classificationPath","excludedDepartmentIds"=excluded."excludedDepartmentIds",active=true
  returning id into course_id;
  seen:=array_append(seen,course_id);
  delete from tt_schedules where "openCourseId"=course_id;
  for s in select * from jsonb_array_elements(c->'schedules') loop
   insert into tt_schedules("openCourseId","dayOfWeek","startPeriod","endPeriod",classroom) values(course_id,s->>'dayOfWeek',(s->>'startPeriod')::int,(s->>'endPeriod')::int,s->>'classroom');
  end loop;
 end loop;
 if replace_all then update tt_open_courses set active=false where not(id=any(seen)); end if;
end $$;

notify pgrst, 'reload schema';


commit;
