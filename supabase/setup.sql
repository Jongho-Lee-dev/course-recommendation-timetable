
begin;


create table if not exists public.tt_departments (id bigint primary key, "majorName" text not null,
                                                                                          "facultyName" text, "collegeName" text);


create table if not exists public.tt_courses ("courseCode" text primary key, title text not null, credit numeric not null check(credit>=0));


create table if not exists public.tt_open_courses (id bigint generated always as identity primary key,
                                                                                          "courseCode" text not null references public.tt_courses("courseCode"),
                                                                                                                                "sectionNo" text not null,
                                                                                                                                                 "professorName" text not null,
                                                                                                                                                                      capacity integer not null check(capacity>0),
                                                                                                                                                                                                "targetGrade" integer not null check("targetGrade">=1),
                                                                                                                                                                                                                               "departmentId" bigint not null references public.tt_departments(id),
                                                                                                                                                                                                                                                                         "isOnline" boolean not null,
                                                                                                                                                                                                                                                                                            "classificationPath" text[] not null,
                                                                                                                                                                                                                                                                                                                        "excludedDepartmentIds" bigint[] not null default '{}',
                                                                                                                                                                                                                                                                                                                                                                          active boolean not null default true,
                                                                                                                                                                                                                                                                                                                                                                                                          unique("courseCode",

                                                                                                                                                                                                                                                                                                                                                                                                            "sectionNo"));


create table if not exists public.tt_schedules (id bigint generated always as identity primary key,
                                                                                       "openCourseId" bigint not null references public.tt_open_courses(id),
                                                                                                                                 "dayOfWeek" text not null check("dayOfWeek" in ('월',

                                                                                                                                                                             '화',
                                                                                                                                                                             '수',
                                                                                                                                                                             '목',
                                                                                                                                                                             '금',
                                                                                                                                                                             '토',
                                                                                                                                                                             '일')),
                                                                                                                                                           "startPeriod" integer not null check("startPeriod">=1),
                                                                                                                                                                                          "endPeriod" integer not null,
                                                                                                                                                                                                              classroom text not null,
                                                                                                                                                                                                                             check("endPeriod">="startPeriod"));


create index if not exists tt_schedules_course on public.tt_schedules("openCourseId");


create table if not exists public.tt_students (owner uuid primary key, "studentId" text not null unique,
                                                                                                 name text not null,
                                                                                                           grade integer not null check(grade>=1),
                                                                                                                                  "departmentId" bigint not null references public.tt_departments(id),
                                                                                                                                                                            "completedCredits" numeric not null check("completedCredits">=0),
                                                                                                                                                                                                                "graduationCredits" numeric not null check("graduationCredits">0),
                                                                                                                                                                                                                                                     "maxCredits" numeric not null check("maxCredits">0),
                                                                                                                                                                                                                                                                                   check("completedCredits"<="graduationCredits"));

-- 목록 전체를 하나의 트랜잭션으로 저장하며 모든 과목 변경은 같은 잠금을 사용합니다.

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


create or replace function public.tt_delete_course(course_id bigint) returns void language plpgsql
set search_path=public as $$
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

grant usage,
select on sequence public.tt_open_courses_id_seq,public.tt_schedules_id_seq to service_role;

revoke all on function public.tt_save_catalog(jsonb,boolean,bigint)
from public,anon,authenticated;

grant execute on function public.tt_save_catalog(jsonb,boolean,bigint) to service_role;

revoke all on function public.tt_delete_course(bigint)
from public,anon,authenticated;

grant execute on function public.tt_delete_course(bigint) to service_role;


commit;


-- SOURCE: 002_seed.sql

-- 원본 엑셀 18개 강좌 + 가데이터 22개 = 총 40개. 모든 추가 인물은 가상입니다.
begin;


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(1,'컴퓨터공학과','컴퓨터소프트웨어학부','AI·SW창의융합대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(2,'소프트웨어학과','컴퓨터소프트웨어학부','AI·SW창의융합대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(3,'경영학과','경영학부','경영대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(4,'자유전공','자유전공학부',null) on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(5,'특수전공',null,null) on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(6,'건축학과','건축학부','공과대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(7,'법학과',null,null) on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(10,'교양학부',null,'교양대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(11,'인공지능학과','AI융합학부','AI·SW창의융합대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(12,'데이터사이언스학과','데이터사이언스학부','AI·SW창의융합대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(13,'정보보안학과','컴퓨터소프트웨어학부','AI·SW창의융합대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(14,'기계공학과',null,'공과대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


insert into public.tt_departments(id,
                     "majorName", "facultyName", "collegeName")
values(15,'토목공학과','건설환경학부','공과대학') on conflict(id) do
update
set "majorName"=excluded."majorName","facultyName"=excluded."facultyName","collegeName"=excluded."collegeName";


select public.tt_save_catalog('[{"courseCode": "CS201", "sectionNo": "01", "title": "자료구조", "professorName": "김교수", "credit": 3.0, "capacity": 40, "targetGrade": 2, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [3, 4], "schedules": [{"dayOfWeek": "월", "startPeriod": 2, "endPeriod": 3, "classroom": "IT Hall 301"}, {"dayOfWeek": "수", "startPeriod": 2, "endPeriod": 3, "classroom": "IT Hall 301"}]}, {"courseCode": "SW201", "sectionNo": "01", "title": "소프트웨어공학", "professorName": "박교수", "credit": 3.0, "capacity": 40, "targetGrade": 2, "departmentId": 2, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [5], "schedules": [{"dayOfWeek": "화", "startPeriod": 4, "endPeriod": 5, "classroom": "IT Hall 202"}]}, {"courseCode": "IS301", "sectionNo": "01", "title": "정보보안개론", "professorName": "이교수", "credit": 3.0, "capacity": 40, "targetGrade": 3, "departmentId": 13, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "목", "startPeriod": 2, "endPeriod": 3, "classroom": "IT Hall 205"}]}, {"courseCode": "ME201", "sectionNo": "01", "title": "기계공학개론", "professorName": "최교수", "credit": 3.0, "capacity": 40, "targetGrade": 2, "departmentId": 14, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "월", "startPeriod": 5, "endPeriod": 6, "classroom": "공학관 101"}]}, {"courseCode": "CE301", "sectionNo": "01", "title": "토목공학개론", "professorName": "정교수", "credit": 3.0, "capacity": 40, "targetGrade": 3, "departmentId": 15, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 6, "endPeriod": 7, "classroom": "공학관 202"}]}, {"courseCode": "AR201", "sectionNo": "01", "title": "건축학개론", "professorName": "한교수", "credit": 3.0, "capacity": 35, "targetGrade": 2, "departmentId": 6, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "화", "startPeriod": 1, "endPeriod": 2, "classroom": "건축관 301"}]}, {"courseCode": "LAW301", "sectionNo": "01", "title": "민법총칙", "professorName": "김법학", "credit": 3.0, "capacity": 50, "targetGrade": 3, "departmentId": 7, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "금", "startPeriod": 2, "endPeriod": 4, "classroom": "법학관 101"}]}, {"courseCode": "CS305", "sectionNo": "01", "title": "컴퓨터 네트워크", "professorName": "박교수", "credit": 3.0, "capacity": 40, "targetGrade": 3, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "화", "startPeriod": 4, "endPeriod": 5, "classroom": "IT Hall 202"}]}, {"courseCode": "CS401", "sectionNo": "01", "title": "웹프로그래밍", "professorName": "박교수", "credit": 3.0, "capacity": 40, "targetGrade": 3, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "금", "startPeriod": 4, "endPeriod": 5, "classroom": "IT Hall 302"}]}, {"courseCode": "GE101", "sectionNo": "01", "title": "대학생활과 진로", "professorName": "이강사", "credit": 2.0, "capacity": 50, "targetGrade": 1, "departmentId": 10, "isOnline": false, "classificationPath": ["교양", "교양 필수", "취·창업실무영역(비전설계영역)", "진로·취업"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 4, "endPeriod": 5, "classroom": "인문관 203"}]}, {"courseCode": "GE202", "sectionNo": "01", "title": "현대사회와 문화", "professorName": "최교수", "credit": 3.0, "capacity": 45, "targetGrade": 2, "departmentId": 10, "isOnline": false, "classificationPath": ["교양", "교양 선택", "경제와 사회(사회와 문화)", "사회와 문화"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "목", "startPeriod": 5, "endPeriod": 6, "classroom": "인문관 105"}]}, {"courseCode": "GE303", "sectionNo": "01", "title": "인간과 사회", "professorName": "정교수", "credit": 3.0, "capacity": 40, "targetGrade": 2, "departmentId": 10, "isOnline": false, "classificationPath": ["교양", "교양 선택", "균형기초학문영역(균형학문영역)", "인문과 철학"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 3, "endPeriod": 4, "classroom": "인문관 201"}]}, {"courseCode": "GE304", "sectionNo": "01", "title": "디지털 시대의 이해", "professorName": "김교수", "credit": 3.0, "capacity": 50, "targetGrade": 1, "departmentId": 10, "isOnline": true, "classificationPath": ["교양", "교양 필수", "균형기초학문영역(균형학문영역)", "디지털 리터러시"], "excludedDepartmentIds": [1, 2], "schedules": []}, {"courseCode": "GE405", "sectionNo": "01", "title": "대학 글쓰기", "professorName": "박강사", "credit": 2.0, "capacity": 45, "targetGrade": 1, "departmentId": 10, "isOnline": false, "classificationPath": ["교양", "교양 필수 선택", "의사소통 영역", "글쓰기·표현"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "금", "startPeriod": 1, "endPeriod": 2, "classroom": "인문관 302"}]}, {"courseCode": "MD201", "sectionNo": "01", "title": "인공지능 기초", "professorName": "강교수", "credit": 3.0, "capacity": 30, "targetGrade": 2, "departmentId": 11, "isOnline": false, "classificationPath": ["마이크로디그리", "마이크로"], "excludedDepartmentIds": [1], "schedules": [{"dayOfWeek": "월", "startPeriod": 6, "endPeriod": 7, "classroom": "AI관 201"}]}, {"courseCode": "MD301", "sectionNo": "01", "title": "머신러닝 실습", "professorName": "이교수", "credit": 3.0, "capacity": 30, "targetGrade": 3, "departmentId": 11, "isOnline": false, "classificationPath": ["마이크로디그리", "마이크로"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 6, "endPeriod": 8, "classroom": "AI관 302"}]}, {"courseCode": "MD401", "sectionNo": "01", "title": "데이터 분석", "professorName": "박교수", "credit": 3.0, "capacity": 35, "targetGrade": 3, "departmentId": 12, "isOnline": true, "classificationPath": ["마이크로디그리", "마이크로"], "excludedDepartmentIds": [], "schedules": []}, {"courseCode": "1234", "sectionNo": "01", "title": "캡스톤디자인1", "professorName": "이교수", "credit": 3.0, "capacity": 40, "targetGrade": 1, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "월", "startPeriod": 1, "endPeriod": 1, "classroom": "없음"}]}, {"courseCode": "CS101", "sectionNo": "01", "title": "컴퓨터개론", "professorName": "김가람", "credit": 3, "capacity": 30, "targetGrade": 1, "departmentId": 1, "isOnline": true, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": []}, {"courseCode": "CS102", "sectionNo": "01", "title": "C프로그래밍", "professorName": "이서연", "credit": 3, "capacity": 40, "targetGrade": 1, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "화", "startPeriod": 3, "endPeriod": 4, "classroom": "IT Hall 201"}]}, {"courseCode": "CS202", "sectionNo": "01", "title": "객체지향프로그래밍", "professorName": "박민준", "credit": 3, "capacity": 50, "targetGrade": 2, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 5, "endPeriod": 6, "classroom": "IT Hall 202"}]}, {"courseCode": "CS203", "sectionNo": "01", "title": "데이터베이스", "professorName": "최지우", "credit": 3, "capacity": 60, "targetGrade": 2, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "목", "startPeriod": 7, "endPeriod": 8, "classroom": "IT Hall 203"}]}, {"courseCode": "CS204", "sectionNo": "01", "title": "컴퓨터구조", "professorName": "정하늘", "credit": 3, "capacity": 30, "targetGrade": 2, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "금", "startPeriod": 1, "endPeriod": 2, "classroom": "IT Hall 204"}]}, {"courseCode": "CS301", "sectionNo": "01", "title": "운영체제", "professorName": "김가람", "credit": 3, "capacity": 40, "targetGrade": 3, "departmentId": 1, "isOnline": true, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": []}, {"courseCode": "CS302", "sectionNo": "01", "title": "알고리즘", "professorName": "이서연", "credit": 3, "capacity": 50, "targetGrade": 3, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "화", "startPeriod": 5, "endPeriod": 6, "classroom": "IT Hall 206"}]}, {"courseCode": "CS303", "sectionNo": "01", "title": "컴퓨터네트워크", "professorName": "박민준", "credit": 3, "capacity": 60, "targetGrade": 3, "departmentId": 1, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 7, "endPeriod": 8, "classroom": "IT Hall 207"}]}, {"courseCode": "SW101", "sectionNo": "01", "title": "파이썬프로그래밍", "professorName": "정하늘", "credit": 3, "capacity": 40, "targetGrade": 1, "departmentId": 2, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "금", "startPeriod": 3, "endPeriod": 4, "classroom": "IT Hall 209"}]}, {"courseCode": "SW202", "sectionNo": "01", "title": "웹프로그래밍", "professorName": "김가람", "credit": 3, "capacity": 50, "targetGrade": 2, "departmentId": 2, "isOnline": true, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": []}, {"courseCode": "SW301", "sectionNo": "01", "title": "백엔드프로그래밍", "professorName": "이서연", "credit": 3, "capacity": 60, "targetGrade": 3, "departmentId": 2, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "화", "startPeriod": 7, "endPeriod": 8, "classroom": "IT Hall 211"}]}, {"courseCode": "SW302", "sectionNo": "01", "title": "모바일앱개발", "professorName": "박민준", "credit": 3, "capacity": 30, "targetGrade": 3, "departmentId": 2, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 1, "endPeriod": 2, "classroom": "IT Hall 212"}]}, {"courseCode": "AI101", "sectionNo": "01", "title": "인공지능입문", "professorName": "최지우", "credit": 3, "capacity": 40, "targetGrade": 1, "departmentId": 11, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "목", "startPeriod": 3, "endPeriod": 4, "classroom": "IT Hall 213"}]}, {"courseCode": "AI201", "sectionNo": "01", "title": "머신러닝", "professorName": "정하늘", "credit": 3, "capacity": 50, "targetGrade": 2, "departmentId": 11, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "금", "startPeriod": 5, "endPeriod": 6, "classroom": "IT Hall 214"}]}, {"courseCode": "AI301", "sectionNo": "01", "title": "딥러닝", "professorName": "김가람", "credit": 3, "capacity": 60, "targetGrade": 3, "departmentId": 11, "isOnline": true, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": []}, {"courseCode": "DS201", "sectionNo": "01", "title": "데이터분석", "professorName": "이서연", "credit": 3, "capacity": 30, "targetGrade": 2, "departmentId": 12, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "화", "startPeriod": 1, "endPeriod": 2, "classroom": "IT Hall 216"}]}, {"courseCode": "DS301", "sectionNo": "01", "title": "빅데이터처리", "professorName": "박민준", "credit": 3, "capacity": 40, "targetGrade": 3, "departmentId": 12, "isOnline": false, "classificationPath": ["전공", "전공 선택"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 3, "endPeriod": 4, "classroom": "IT Hall 217"}]}, {"courseCode": "IS201", "sectionNo": "01", "title": "암호학기초", "professorName": "최지우", "credit": 3, "capacity": 50, "targetGrade": 2, "departmentId": 13, "isOnline": false, "classificationPath": ["전공", "전공 필수"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "목", "startPeriod": 5, "endPeriod": 6, "classroom": "IT Hall 218"}]}, {"courseCode": "GE102", "sectionNo": "01", "title": "글쓰기와소통", "professorName": "김가람", "credit": 3, "capacity": 30, "targetGrade": 1, "departmentId": 10, "isOnline": true, "classificationPath": ["교양", "교양 선택", "일반 교양"], "excludedDepartmentIds": [], "schedules": []}, {"courseCode": "GE103", "sectionNo": "01", "title": "음악의이해", "professorName": "이서연", "credit": 3, "capacity": 40, "targetGrade": 1, "departmentId": 10, "isOnline": false, "classificationPath": ["교양", "교양 선택", "일반 교양"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "화", "startPeriod": 3, "endPeriod": 4, "classroom": "IT Hall 221"}]}, {"courseCode": "GE104", "sectionNo": "01", "title": "환경과사회", "professorName": "박민준", "credit": 3, "capacity": 50, "targetGrade": 1, "departmentId": 10, "isOnline": false, "classificationPath": ["교양", "교양 선택", "일반 교양"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "수", "startPeriod": 5, "endPeriod": 6, "classroom": "IT Hall 222"}]}, {"courseCode": "GE105", "sectionNo": "01", "title": "생활속통계", "professorName": "최지우", "credit": 3, "capacity": 60, "targetGrade": 1, "departmentId": 10, "isOnline": false, "classificationPath": ["교양", "교양 선택", "일반 교양"], "excludedDepartmentIds": [], "schedules": [{"dayOfWeek": "목", "startPeriod": 7, "endPeriod": 8, "classroom": "IT Hall 223"}]}]'::jsonb, false, null);


commit;


-- SOURCE: 003_enrollments.sql

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


-- SOURCE: 004_enrollment_response.sql

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


-- SOURCE: 005_student_auth.sql

-- 기존 학생/신청내역 보존. 기존 학생은 관리자 확인 후 비밀번호 설정 필요.

ALTER TABLE public.tt_students ADD COLUMN IF NOT EXISTS "passwordHash" text;

REVOKE ALL ON public.tt_students
FROM anon, authenticated;

NOTIFY pgrst, 'reload schema';


-- SOURCE: 006_course_syllabi.sql

begin;

alter table public.tt_open_courses
    add column if not exists "syllabusPath" text,
    add column if not exists "syllabusName" text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'course-syllabi',
    'course-syllabi',
    false,
    10485760,
    array['application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;

notify pgrst, 'reload schema';


-- SOURCE: 007_notices.sql

-- Current notice API contract; not an export of the production table.
begin;

create table if not exists public.notice (
    id bigint generated by default as identity primary key,
    title text not null,
    content text not null,
    author text not null default '관리자',
    is_pinned boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.notice enable row level security;
revoke all on public.notice from anon, authenticated;
grant all on public.notice to service_role;
grant usage, select on sequence public.notice_id_seq to service_role;

commit;
notify pgrst, 'reload schema';
