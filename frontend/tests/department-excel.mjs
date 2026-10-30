import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import * as XLSX from "xlsx";

const server = await createServer({
  root: fileURLToPath(new URL("../", import.meta.url)),
  server: { middlewareMode: true },
});

try {
  const { saveDepartmentExcel, departmentExcelErrorMessage } =
    await server.ssrLoadModule("/src/admin/utils/departmentExcel.ts");
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ["학과코드", "단과대학", "학부", "학과"],
      [1, "공과대학", "", "기존학과"],
      [2, "공과대학", "", "다른학과"],
    ]),
    "학과",
  );
  const data = XLSX.write(book, { type: "array", bookType: "xlsx" });
  const draft = { id: 1, collegeName: "공과대학", majorName: "수정학과" };
  const stale = new DOMException("File changed", "InvalidStateError");
  let reads = 0;
  let writes = 0;
  let aborted = 0;
  let saved;
  const handle = {
    requestPermission: async () => "granted",
    getFile: async () => {
      reads++;
      const staleSnapshot = reads === 1;
      return {
        size: data.byteLength,
        arrayBuffer: async () => {
          if (staleSnapshot) throw stale;
          return data;
        },
      };
    },
    createWritable: async () => {
      writes++;
      return {
        write: async (value) => { saved = value; },
        close: async () => {},
        abort: async () => { aborted++; },
      };
    },
  };
  const updated = await saveDepartmentExcel(handle, draft, true);
  assert.equal(reads, 2);
  assert.equal(writes, 1);
  assert.equal(updated[0].majorName, "수정학과");
  assert.equal(updated[1].majorName, "다른학과");
  const savedBook = XLSX.read(saved, { type: "array" });
  assert.equal(savedBook.Sheets["학과"].D2.v, "수정학과");

  reads = 0;
  writes = 0;
  await assert.rejects(saveDepartmentExcel({
    ...handle,
    getFile: async () => { reads++; throw stale; },
  }, draft, true), (error) => error === stale);
  assert.equal(reads, 2, "Persistent read failures must stop after one retry");
  assert.equal(writes, 0, "Failed reads must not write to the file");

  reads = 1;
  await assert.rejects(saveDepartmentExcel({
    ...handle,
    createWritable: async () => {
      writes++;
      return {
        write: async () => {},
        close: async () => { throw stale; },
        abort: async () => { aborted++; },
      };
    },
  }, draft, true), (error) => error === stale);
  assert.equal(writes, 1, "Failed saves must not be replayed automatically");
  assert.equal(aborted, 1);
  assert.match(departmentExcelErrorMessage(stale), /저장하고 닫은 뒤/);
  assert.match(departmentExcelErrorMessage(
    new DOMException("Locked", "NoModificationAllowedError"),
  ), /입력한 수정 내용은 유지/);
  console.log("PASS: stale-file recovery, bounded retries, preservation of other departments, failed-save cleanup, Korean error guidance");
} finally {
  await server.close();
}
