-- 새 구현은 tt_ 접두사로 기존 팀 테이블과 충돌을 피합니다. 현재 학기 한 개 기준.
begin;
create table if not exists public.tt_departments (id bigint primary key, "majorName" text not null, "facultyName" text, "collegeName" text);
create table if not exists public.tt_courses (
 "courseCode" text primary key, title text not null, credit numeric not null check(credit>=0)
);
create table if not exists public.tt_open_courses (
 id bigint generated always as identity primary key,
 "courseCode" text not null references public.tt_courses("courseCode"),
 "sectionNo" text not null, "professorName" text not null,
 capacity integer not null check(capacity>0), "targetGrade" integer not null check("targetGrade">=1),
 "departmentId" bigint not null references public.tt_departments(id),
 "isOnline" boolean not null, "classificationPath" text[] not null,
 "excludedDepartmentIds" bigint[] not null default '{}', active boolean not null default true,
 unique("courseCode","sectionNo")
);
create table if not exists public.tt_schedules (
 id bigint generated always as identity primary key, "openCourseId" bigint not null references public.tt_open_courses(id),
 "dayOfWeek" text not null check("dayOfWeek" in ('월','화','수','목','금','토','일')),
 "startPeriod" integer not null check("startPeriod">=1), "endPeriod" integer not null,
 classroom text not null, check("endPeriod">="startPeriod")
);
create index if not exists tt_schedules_course on public.tt_schedules("openCourseId");
create table if not exists public.tt_students (
 owner uuid primary key, "studentId" text not null unique, name text not null,
 grade integer not null check(grade>=1), "departmentId" bigint not null references public.tt_departments(id),
 "completedCredits" numeric not null check("completedCredits">=0),
 "graduationCredits" numeric not null check("graduationCredits">0), "maxCredits" numeric not null check("maxCredits">0),
 check("completedCredits"<="graduationCredits")
);
-- 목록 전체를 하나의 트랜잭션으로 저장하며 모든 과목 변경은 같은 잠금을 사용합니다.
create or replace function public.tt_save_catalog(items jsonb, replace_all boolean default false, edit_id bigint default null)
returns void language plpgsql set search_path=public as $$
declare c jsonb; s jsonb; course_id bigint; seen bigint[] := '{}';
begin
 perform pg_advisory_xact_lock(20261014);
 if jsonb_array_length(items)=0 then raise exception 'Empty catalog'; end if;
 if edit_id > 0 and (jsonb_array_length(items)<>1 or not exists(select 1 from tt_open_courses where id=edit_id and active)) then raise exception 'Invalid edit id'; end if;
 if exists(select 1 from jsonb_array_elements(items) x group by x->>'courseCode',x->>'sectionNo' having count(*)>1) then raise exception 'Duplicate course key'; end if;
 for c in select * from jsonb_array_elements(items) loop
  if exists(select 1 from jsonb_array_elements_text(c->'excludedDepartmentIds') x where not exists(select 1 from tt_departments where id=x::bigint)) then raise exception 'Unknown excluded department'; end if;
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
create or replace function public.tt_delete_course(course_id bigint) returns void language plpgsql set search_path=public as $$
begin
 perform pg_advisory_xact_lock(20261014);
 update tt_open_courses set active=false where id=course_id;
end $$;
-- 프론트 직접 접근을 차단하고 FastAPI의 service_role만 허용합니다.
do $$ declare t text; begin
 foreach t in array array['tt_departments','tt_courses','tt_open_courses','tt_schedules','tt_students'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant usage,select on sequence public.tt_open_courses_id_seq,public.tt_schedules_id_seq to service_role;
revoke all on function public.tt_save_catalog(jsonb,boolean,bigint) from public,anon,authenticated;
grant execute on function public.tt_save_catalog(jsonb,boolean,bigint) to service_role;
revoke all on function public.tt_delete_course(bigint) from public,anon,authenticated;
grant execute on function public.tt_delete_course(bigint) to service_role;
commit;
