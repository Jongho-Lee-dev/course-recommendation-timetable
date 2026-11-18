import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../../", import.meta.url));
const db = new PGlite();
await db.exec(
  "create role anon;create role authenticated;create role service_role bypassrls;",
);
for (const name of ["001_schema.sql", "002_seed.sql", "003_enrollments.sql"])
  await db.exec(await fs.readFile(root + "supabase/" + name, "utf8"));
// 재실행 가능한 추가 마이그레이션
await db.exec(await fs.readFile(root + "supabase/003_enrollments.sql", "utf8"));
const owners = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
];
for (let i = 0; i < owners.length; i++)
  await db.query(
    'insert into tt_students(owner,"studentId",name,grade,"departmentId","completedCredits","graduationCredits","maxCredits") values($1,$2,\'학생\',2,1,0,130,18)',
    [owners[i], `TEST${i}`],
  );
const seed = JSON.parse(
  await fs.readFile(root + "backend/seed_courses.json", "utf8"),
);
const id = (code) =>
  db
    .query(
      'select id from tt_open_courses where "courseCode"=$1 and "sectionNo"=\'01\'',
      [code],
    )
    .then((r) => r.rows[0].id);
const cs = await id("CS201");
await db.query("update tt_open_courses set capacity=1 where id=$1", [cs]);
const change = (who, ids, action = "add") =>
  db.query("select tt_change_enrollments($1::uuid,$2::bigint[],$3)", [
    who,
    ids,
    action,
  ]);
const count = async (c) =>
  (
    await db.query(
      "select count(*)::int n from tt_enrollments where \"openCourseId\"=$1 and status='enrolled'",
      [c],
    )
  ).rows[0].n;
await change(owners[0], [cs]);
assert.equal(await count(cs), 1);
await change(owners[0], [cs]);
assert.equal(await count(cs), 1);
await assert.rejects(change(owners[1], [cs]), /정원/);
assert.equal(await count(cs), 1);
assert.equal(
  (
    await db.query(
      'select count(*)::int n from tt_enrollments where "studentOwner"=$1',
      [owners[1]],
    )
  ).rows[0].n,
  0,
);
await change(owners[0], [cs], "cancel");
assert.equal(await count(cs), 0);
await change(owners[0], [cs], "cancel");
assert.equal(await count(cs), 0);
await change(owners[1], [cs]);
assert.equal(await count(cs), 1);
const snap = (
  await db.query("select tt_enrollment_snapshot($1::uuid) s", [owners[1]])
).rows[0].s;
assert.deepEqual(snap.courseIds, [cs]);
assert.equal(snap.counts.find((c) => c.id === cs).enrolledCount, 1);
// 존재하지 않는 강좌가 섞인 일괄 요청 전체 롤백
const online = await id("CS101");
await assert.rejects(change(owners[0], [online, 999999]));
assert.equal(await count(online), 0);
// 같은 과목 다른 분반
const copy = structuredClone(seed[0]);
copy.sectionNo = "02";
await db.query("select tt_save_catalog($1::jsonb,false,null)", [
  JSON.stringify([copy]),
]);
const other = (
  await db.query(
    "select id from tt_open_courses where \"courseCode\"='CS201' and \"sectionNo\"='02'",
  )
).rows[0].id;
await assert.rejects(change(owners[1], [other]), /중복/);
// 겹치는 시간의 다른 과목
const overlap = structuredClone(seed[0]);
overlap.courseCode = "TEST_OVERLAP";
await db.query("select tt_save_catalog($1::jsonb,false,null)", [
  JSON.stringify([overlap]),
]);
await assert.rejects(change(owners[1], [await id("TEST_OVERLAP")]), /시간/);
// 신청 학점 초과
await db.query('update tt_students set "maxCredits"=2 where owner=$1', [
  owners[0],
]);
await assert.rejects(change(owners[0], [online]), /학점/);
// 제외학과
const excluded = await id("GE304");
await assert.rejects(change(owners[0], [excluded]), /제외/);
// 등록하지 않은 소유자 및 비활성 강좌
await assert.rejects(
  change("00000000-0000-4000-8000-000000000099", [online]),
  /학생/,
);
await db.query("select tt_delete_course($1)", [online]);
await assert.rejects(change(owners[2], [online]), /강좌/);
// replace 요청 실패시 기존 신청 복구
await assert.rejects(change(owners[1], [999999], "replace"));
assert.equal(await count(cs), 1);
// 신청자가 있는 강좌를 정원 미만/시간 변경으로 수정하면 차단. 동일 정보 재업로드 허용.
const edited = structuredClone(seed[0]);
edited.capacity = 1;
await db.query("select tt_save_catalog($1::jsonb,false,null)", [
  JSON.stringify([edited]),
]);
edited.schedules[0].startPeriod = 1;
await assert.rejects(
  db.query("select tt_save_catalog($1::jsonb,false,null)", [
    JSON.stringify([edited]),
  ]),
  /신청자가/,
);
// 비활성화해도 신청 기록 유지, 취소는 가능
await db.query("select tt_delete_course($1)", [cs]);
await change(owners[1], [cs], "cancel");
assert.equal(await count(cs), 0);
// 실제 표시 뷰와 정원 감소 방지
const two = structuredClone(seed[0]);
two.capacity = 2;
await db.query("select tt_save_catalog($1::jsonb,false,null)", [
  JSON.stringify([two]),
]);
await db.query('update tt_students set "maxCredits"=18 where owner=$1', [
  owners[0],
]);
await change(owners[0], [cs]);
await change(owners[1], [cs]);
two.capacity = 1;
await assert.rejects(
  db.query("select tt_save_catalog($1::jsonb,false,null)", [
    JSON.stringify([two]),
  ]),
  /정원/,
);
assert.equal(
  (
    await db.query(
      'select "enrolledCount" n from tt_course_seats where "openCourseId"=$1',
      [cs],
    )
  ).rows[0].n,
  2,
);
// 동시에 도착한 마지막 한 자리 요청: 하나만 성공해야 합니다.
const last = structuredClone(seed[0]);
last.courseCode = "TEST_LAST";
last.capacity = 1;
last.credit = 1;
last.isOnline = true;
last.schedules = [];
last.excludedDepartmentIds = [];
await db.query("select tt_save_catalog($1::jsonb,false,null)", [
  JSON.stringify([last]),
]);
const lastId = await id("TEST_LAST");
const attempts = await Promise.allSettled(
  owners.map((o) => change(o, [lastId])),
);
assert.equal(attempts.filter((r) => r.status === "fulfilled").length, 1);
assert.equal(await count(lastId), 1);
await db.exec("set role anon;");
await assert.rejects(db.query("select * from tt_enrollments"));
await assert.rejects(
  db.query("select tt_change_enrollments($1::uuid,$2::bigint[],'add')", [
    owners[0],
    [cs],
  ]),
);
await db.exec("reset role;");
console.log(
  "PASS: 신청/재시도/정원/취소/재신청/학생분리/일괄롤백/중복분반/시간/학점/제외학과/비활성강좌/정보변경보호/익명차단",
);
await db.close();
