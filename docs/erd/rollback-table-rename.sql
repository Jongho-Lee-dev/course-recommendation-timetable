BEGIN;
ALTER TABLE public.departments RENAME TO tt_departments;
ALTER TABLE public.students RENAME TO tt_students;
ALTER TABLE public.courses RENAME TO tt_courses;
ALTER TABLE public.open_courses RENAME TO tt_open_courses;
ALTER TABLE public.schedules RENAME TO tt_schedules;
ALTER TABLE public.enrollments RENAME TO tt_enrollments;
ALTER TABLE public.registration_period RENAME TO tt_registration_period;
ALTER VIEW public.course_seats RENAME TO tt_course_seats;
CREATE OR REPLACE FUNCTION public.tt_enrollment_snapshot(p_owner uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$

 select jsonb_build_object(

  'counts',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'enrolledCount',(select count(*) from tt_enrollments e where e."openCourseId"=o.id and e.status='enrolled'))) from tt_open_courses o),'[]'::jsonb),

  'courseIds',coalesce((select jsonb_agg(e."openCourseId" order by e.id) from tt_enrollments e where e."studentOwner"=p_owner and e.status='enrolled'),'[]'::jsonb)

 )

$function$

CREATE OR REPLACE FUNCTION public.tt_delete_course(course_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$

begin

 perform pg_advisory_xact_lock(20261014);

 update tt_open_courses set active=false where id=course_id;

end $function$

CREATE OR REPLACE FUNCTION public.tt_save_catalog(items jsonb, replace_all boolean DEFAULT false, edit_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$

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

end $function$

CREATE OR REPLACE FUNCTION public.tt_change_enrollments(p_owner uuid, p_course_ids bigint[], p_action text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$

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

end $function$

CREATE OR REPLACE FUNCTION public.tt_enrollment_state(p_owner uuid)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$

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

$function$

COMMIT;
