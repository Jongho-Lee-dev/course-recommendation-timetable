import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../../", import.meta.url)).replace(
  /[\\/]$/,
  "",
);
const db = new PGlite();
await db.exec(
  "create role anon;create role authenticated;create role service_role bypassrls;",
);
await db.exec(await fs.readFile(root + "/supabase/001_schema.sql", "utf8"));
await db.exec(await fs.readFile(root + "/supabase/002_seed.sql", "utf8"));
assert.equal(
  (await db.query("select count(*)::int n from tt_open_courses where active"))
    .rows[0].n,
  40,
);
assert.equal(
  (await db.query("select count(*)::int n from tt_schedules")).rows[0].n,
  34,
);
const seed = JSON.parse(
  await fs.readFile(root + "/backend/seed_courses.json", "utf8"),
);
const first = await db.query(
  'select id from tt_open_courses where "courseCode"=$1',
  [seed[0].courseCode],
);
await db.query("select tt_save_catalog($1::jsonb,true,null)", [
  JSON.stringify(seed.slice(0, 2)),
]);
assert.equal(
  (await db.query("select count(*)::int n from tt_open_courses where active"))
    .rows[0].n,
  2,
);
await db.query("select tt_save_catalog($1::jsonb,true,null)", [
  JSON.stringify(seed),
]);
assert.equal(
  (
    await db.query('select id from tt_open_courses where "courseCode"=$1', [
      seed[0].courseCode,
    ])
  ).rows[0].id,
  first.rows[0].id,
);
let invalid = structuredClone(seed);
invalid[1].departmentId = 999;
await assert.rejects(
  db.query("select tt_save_catalog($1::jsonb,true,null)", [
    JSON.stringify(invalid),
  ]),
);
assert.equal(
  (await db.query("select count(*)::int n from tt_open_courses where active"))
    .rows[0].n,
  40,
);
const changed = structuredClone(seed[0]);
changed.courseCode = "TEST_CHANGED";
changed.sectionNo = "02";
await db.query("select tt_save_catalog($1::jsonb,false,$2)", [
  JSON.stringify([changed]),
  first.rows[0].id,
]);
assert.equal(
  (
    await db.query('select id from tt_open_courses where "courseCode"=$1', [
      "TEST_CHANGED",
    ])
  ).rows[0].id,
  first.rows[0].id,
);
await db.exec("set role anon;");
await assert.rejects(db.query("select * from tt_students"));
await assert.rejects(
  db.query("select tt_save_catalog($1::jsonb,true,null)", [
    JSON.stringify(seed),
  ]),
);
await db.exec("reset role;");
console.log(
  "SQL PASS: schema, 40 seeds, schedules, replace/reactivate, stable IDs, rollback, rename, anon denial",
);
await db.close();
