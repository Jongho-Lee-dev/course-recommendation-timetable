import { api } from "../../shared/api";
import { useState } from "react";
import {
  readCourseExcel,
  convertCourseExcel,
  type ExcelValidationError,
} from "../utils/importCourses";
import type { CourseListItem } from "../../shared/types/database";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";

export default function CourseExcelImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    ExcelValidationError[]
  >([]);

  const courses = useCourseCatalogStore((state) => state.courses);

  const [previewCourses, setPreviewCourses] = useState<CourseListItem[]>([]);

  return (
    <div>
      <p className="mb-3">
        업로드한 엑셀 전체를 최신 목록으로 적용합니다. 파일에 없는 강좌는
        목록에서 제외됩니다.
      </p>
      <input
        type="file"
        accept=".xlsx"
        disabled={loading}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;

          setSelectedFile(file);
          setRows([]);
          setError("");
          setValidationErrors([]);
          setPreviewCourses([]);
          setLoading(true);

          try {
            const result = await readCourseExcel(file);

            const converted = convertCourseExcel(result, courses);
            setRows(result);
            setValidationErrors(converted.errors);
            setPreviewCourses(converted.courses);
          } catch {
            setError("엑셀 파일을 읽지 못했습니다.");
          } finally {
            setLoading(false);
          }
        }}
      />
      {loading && <p>파일을 읽는 중입니다.</p>}
      {error && <p role="alert">{error}</p>}

      {validationErrors.length > 0 && (
        <ul role="alert" className="my-3 space-y-1 text-red-600">
          {validationErrors.map((item, index) => (
            <li key={index}>
              {item.row}행: {item.message}
            </li>
          ))}
        </ul>
      )}

      {previewCourses.length > 0 && validationErrors.length === 0 && (
        <p className="my-3 text-green-700">
          검증 완료: {previewCourses.length}개 과목을 적용할 수 있습니다.
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, columnIndex) => (
                    <td key={columnIndex} className="border px-3 py-2">
                      {String(cell ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          disabled={
            loading ||
            !selectedFile ||
            validationErrors.length > 0 ||
            previewCourses.length === 0
          }
          onClick={async () => {
            if (!selectedFile) return;
            setLoading(true);
            setError("");
            try {
              const form = new FormData();
              form.append("file", selectedFile);
              const updated = await api<CourseListItem[]>(
                "/admin/courses-import",
                { method: "POST", body: form },
              );
              useCourseCatalogStore.getState().setCourses(updated);
              setError("");
              setRows([]);
              setPreviewCourses([]);
              setSelectedFile(null);
              alert(
                `DB 저장 완료: ${updated.length}개 과목. 파일에 없는 기존 강좌는 비활성화됩니다.`,
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : "DB 저장 실패");
            } finally {
              setLoading(false);
            }
          }}
          className="cursor-pointer rounded-md bg-[#7658e9] px-4 py-2 font-semibold text-white hover:bg-[#6546d6] active:bg-[#5538bd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7658e9]"
        >
          {loading ? "저장 중…" : "엑셀 시트 적용하기"}
        </button>
      </div>
    </div>
  );
}
