// npm install 후 프로젝트 루트에서 node frontend/tests/enrollment-store.mjs
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = fileURLToPath(new URL("../", import.meta.url));
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};
globalThis.localStorage = storage();
globalThis.sessionStorage = storage();
sessionStorage.setItem("student-token", "test-session");
let enrolled = false;
let fail = false;
let writes = 0;
let release;
let readGate;
const course = () => ({
  id: 1,
  courseCode: "TEST",
  sectionNo: "01",
  title: "테스트",
  capacity: 2,
  credit: 3,
  isOnline: true,
  schedules: [],
  enrolledCount: Number(enrolled),
  remainingSeats: 2 - Number(enrolled),
});
globalThis.fetch = async (_url, options) => {
  if (options.method === "POST") {
    writes++;
    if (release)
      await new Promise((resolve) => {
        release.resolve = resolve;
      });
    if (fail)
      return new Response(JSON.stringify({ detail: "저장 실패" }), {
        status: 409,
      });
    const body = JSON.parse(options.body);
    enrolled =
      body.action === "add" ||
      (body.action === "replace" && body.courseIds.includes(1));
  }
  const data = {
    studentId: "TEST-STUDENT",
    courses: [course()],
    enrolled: enrolled ? [course()] : [],
  };
  if (options.method !== "POST" && readGate)
    await new Promise((resolve) => {
      readGate.resolve = resolve;
    });
  return new Response(JSON.stringify(data));
};
const server = await createServer({
  root,
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { useCourseStore: store } = await server.ssrLoadModule(
    "/src/registration/store/courseStore.ts",
  );
  const { useUserStore: users } = await server.ssrLoadModule(
    "/src/registration/store/userStore.ts",
  );
  const { useCourseCatalogStore: catalog } = await server.ssrLoadModule(
    "/src/shared/store/courseCatalogStore.ts",
  );
  users.setState({ user: { studentId: "TEST-STUDENT" } });
  await store.getState().loadEnrollments();
  assert.equal(store.getState().selected.length, 0);
  assert.equal(await store.getState().changeEnrollments([1], "add"), true);
  assert.equal(store.getState().selected.length, 1);
  assert.equal(store.getState().history.length, 1);
  assert.equal(catalog.getState().courses[0].enrolledCount, 1);
  store.setState({ selected: [], history: [] });
  await store.getState().loadEnrollments();
  assert.equal(store.getState().selected.length, 1);
  fail = true;
  assert.equal(await store.getState().changeEnrollments([1], "cancel"), false);
  assert.equal(store.getState().selected.length, 1);
  fail = false;
  release = {};
  const pending = store.getState().changeEnrollments([1], "cancel");
  assert.equal(await store.getState().changeEnrollments([1], "cancel"), false);
  release.resolve();
  await pending;
  release = null;
  assert.equal(store.getState().selected.length, 0);
  assert.equal(store.getState().history.length, 0);
  assert.equal(catalog.getState().courses[0].remainingSeats, 2);
  assert.equal(writes, 3);
  users.setState({ user: { studentId: "DIFFERENT" } });
  enrolled = true;
  await store.getState().loadEnrollments();
  assert.equal(store.getState().selected.length, 0);
  users.setState({ user: { studentId: "TEST-STUDENT" } });
  enrolled = false;
  readGate = {};
  const oldRead = store.getState().loadEnrollments();
  await store.getState().changeEnrollments([1], "add");
  readGate.resolve();
  await oldRead;
  readGate = null;
  assert.equal(
    store.getState().selected.length,
    1,
    "오래된 조회가 신청 성공을 덮어쓰면 안 됩니다.",
  );
  console.log(
    "PASS: frontend 신청/취소 상태, 인원 표시, 서버 내역 복원, 실패 시 유지, 중복클릭 차단, 학생 분리",
  );
} finally {
  await server.close();
}
