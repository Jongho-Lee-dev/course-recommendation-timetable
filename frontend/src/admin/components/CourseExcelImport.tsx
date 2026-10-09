import { useCatalog } from "../../shared/hooks/useCatalog";
import { toast } from "sonner";
import { useState } from "react"
import { readCourseExcel, convertCourseExcel, type ExcelValidationError, } from "../utils/importCourses";
import type { CourseListItem } from "../../shared/types/database";
import { useCourseCatalogStore } from "../../shared/store/courseCatalogStore";

export default function CourseExcelImport() {
  const { departments } = useCatalog().data!;
  const [rows, setRows] = useState<unknown[][]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ExcelValidationError[]>([]);

  const courses = useCourseCatalogStore((state) => state.courses);

  const [previewCourses, setPreviewCourses] = useState<CourseListItem[]>([]);

  return (
    <div>
      <input type="file"
        accept=".xlsx"
        disabled={loading}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          event.target.value = "";
          if (!file) return;

          setRows([]);
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
          disabled={loading || !previewCourses.length || validationErrors.length > 0}
          onClick={() => {
            const merged = new Map(courses.map(course => [course.id, course]));
            previewCourses.forEach(course => merged.set(course.id, course));
            useCourseCatalogStore.getState().setCourses([...merged.values()]);
            setRows([]); setPreviewCourses([]);
            toast.success("엑셀 과목을 브라우저 미리보기에 적용했습니다. DB에는 저장되지 않습니다.");
          }}
          className="cursor-pointer rounded-md bg-[#7658e9] px-4 py-2 font-semibold text-white hover:bg-[#6546d6] active:bg-[#5538bd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7658e9]"
        >
          엑셀 시트 적용하기
        </button>
      </div>
    </div>
  )
}
