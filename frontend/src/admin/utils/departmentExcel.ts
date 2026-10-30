import * as XLSX from "xlsx";
import type { Department } from "../../shared/types/database";

const headers = ["학과코드", "단과대학", "학부", "학과"];

function parseRows(rows: unknown[][], allowEmpty = false): Department[] {
  if (JSON.stringify(rows[0]) !== JSON.stringify(headers)) {
    throw new Error("열 순서는 학과코드, 단과대학, 학부, 학과여야 합니다.");
  }
  const seen = new Set<number>();
  const items: Department[] = [];
  rows.slice(1).forEach((row, index) => {
    if (row.every((value) => !String(value ?? "").trim())) return;
    const [code, collegeName, facultyName, majorName] = row.map((value) =>
      String(value ?? "").trim(),
    );
    const id = Number(code);
    if (!/^\d+$/.test(code) || !Number.isSafeInteger(id) || id < 1)
      throw new Error(`${index + 2}행: 학과코드는 양의 정수여야 합니다.`);
    if (seen.has(id)) throw new Error(`${index + 2}행: 중복된 학과코드입니다.`);
    if (!majorName) throw new Error(`${index + 2}행: 학과명을 입력하세요.`);
    if (
      [collegeName, facultyName, majorName].some((value) => value.length > 120)
    )
      throw new Error(`${index + 2}행: 이름은 120자 이하여야 합니다.`);
    seen.add(id);
    items.push({
      id,
      collegeName: collegeName || undefined,
      facultyName: facultyName || undefined,
      majorName,
    });
  });
  if (!allowEmpty && !items.length) throw new Error("적용할 학과가 없습니다.");
  return items;
}

function rowsFor(items: Department[]) {
  return [
    headers,
    ...items.map((d) => [
      d.id,
      d.collegeName ?? "",
      d.facultyName ?? "",
      d.majorName,
    ]),
  ];
}

async function readBook(file: File) {
  if (file.size > 5 * 1024 * 1024)
    throw new Error("5MB 이하의 엑셀만 선택하세요.");
  const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new Error("엑셀 파일에 시트가 없습니다.");
  if (
    Object.values(sheet).some(
      (cell) => cell && typeof cell === "object" && "f" in cell,
    )
  )
    throw new Error("수식 대신 학과 정보를 직접 입력하세요.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  if (rows.length > 10001)
    throw new Error("최대 10000행까지 적용할 수 있습니다.");
  return { book, items: parseRows(rows, true) };
}

export async function readDepartmentExcel(file: File) {
  return (await readBook(file)).items;
}

export function downloadDepartmentExcel(items: Department[]) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet(rowsFor(items)),
    "학과 목록",
  );
  XLSX.writeFile(book, "학과 데이터.xlsx");
}

export async function saveDepartmentExcel(
  handle: FileSystemFileHandle,
  draft: Department,
  editing: boolean,
) {
  if ((await handle.requestPermission({ mode: "readwrite" })) !== "granted")
    throw new Error("엑셀 파일의 쓰기 권한을 허용하세요.");
  const { book, items } = await readBook(await handle.getFile());
  const exists = items.some((d) => d.id === draft.id);
  if (editing && !exists)
    throw new Error("선택한 엑셀에 수정할 학과코드가 없습니다.");
  if (!editing && exists)
    throw new Error("선택한 엑셀에 같은 학과코드가 있습니다.");
  const updated = parseRows(
    rowsFor(
      [...items.filter((d) => d.id !== draft.id), draft].sort(
        (a, b) => a.id - b.id,
      ),
    ),
  );
  book.Sheets[book.SheetNames[0]] = XLSX.utils.aoa_to_sheet(rowsFor(updated));
  const writable = await handle.createWritable();
  try {
    await writable.write(XLSX.write(book, { type: "array", bookType: "xlsx" }));
    await writable.close();
  } catch (error) {
    await writable.abort().catch(() => {});
    throw error;
  }
  return updated;
}
