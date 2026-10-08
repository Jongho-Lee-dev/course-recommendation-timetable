import { useState } from "react"
import { readCourseExcel } from "../utils/importCourses"

export default function CourseExcelImport() {
  const [rows, setRows] = useState<unknown[][]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <input type="file"
        accept=".xlsx"
        disabled={loading}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return;

          setRows([]);
          setError("");
          setLoading(true);

          try {
            const result = await readCourseExcel(file);
            setRows(result);
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
    </div>
  )
}
