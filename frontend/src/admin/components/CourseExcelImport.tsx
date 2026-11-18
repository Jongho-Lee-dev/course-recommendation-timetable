import { useCatalog } from "../../shared/hooks/useCatalog";
import { toast } from "sonner";
import { useState } from "react"
import { readCourseExcel, convertCourseExcel, type ExcelValidationError, } from "../utils/importCourses";
import type { CourseListItem } from "../../shared/types/database";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";
import { api } from "../../shared/api";

export default function CourseExcelImport() {
  const catalog = useCatalog();
  const { departments } = catalog.data!;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<unknown[][]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ExcelValidationError[]>([]);

  const courses = useCourseCatalogStore((state) => state.courses);

  const [previewCourses, setPreviewCourses] = useState<CourseListItem[]>([]);

  return (
    <div>
      <p className="mb-3">시트를 적용하면 과목 목록이 DB에 저장됩니다. 시트에 없는 기존 과목은 비활성화됩니다.</p>
      <input type="file"
        accept=".xlsx"
        disabled={loading}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = "";
          if (!file) return;

          setRows([]);
          setSelectedFile(null);
          setError("");
          setValidationErrors([]);
          setPreviewCourses([]);
          setLoading(true);

          try {
            const result = await readCourseExcel(file);

            const converted = convertCourseExcel(result, courses, departments);
            setRows(result);
            setValidationErrors(converted.errors);
            setPreviewCourses(converted.courses);
            setSelectedFile(file);
          }
          catch {
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
                    <td
                      key={columnIndex}
                      className="border px-3 py-2"
                    >
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
          disabled={loading || !selectedFile || !previewCourses.length || validationErrors.length > 0}
          onClick={async () => {
            if (!selectedFile) return;
            setLoading(true);
            setError("");
            try {
              const body = new FormData();
              body.append("file", selectedFile);
              const result = await api<{ savedCount: number }>("/admin/courses-import", { method: "POST", body });
              setRows([]); setPreviewCourses([]); setSelectedFile(null);
              toast.success(`${result.savedCount}개 과목을 DB에 저장했습니다.`);
              const refreshed = await catalog.refetch();
              if (refreshed.data && !refreshed.isError) useCourseCatalogStore.getState().setCourses(refreshed.data.courses);
              else setError("DB 저장은 완료됐지만 목록을 다시 불러오지 못했습니다. 페이지를 새로고침하세요.");
            } catch (error) {
              setError(error instanceof Error ? error.message : "DB 저장 실패");
            } finally {
              setLoading(false);
            }
          }}
          className="cursor-pointer rounded-md bg-[#7658e9] px-4 py-2 font-semibold text-white hover:bg-[#6546d6] active:bg-[#5538bd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7658e9]"
        >
          {loading ? "처리 중…" : "엑셀 시트 적용하기"}
        </button>
      </div>
    </div>
  )
}
