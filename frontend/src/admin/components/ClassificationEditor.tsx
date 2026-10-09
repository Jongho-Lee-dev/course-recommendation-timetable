import { useId } from "react";
import type { CourseListItem } from "../../shared/types/database";
import { getClassificationPath } from "../../shared/data/courseClassification";
import { useCatalog } from "../../shared/hooks/useCatalog";

const MAX_CLASSIFICATION_DEPTH = 5;

export default function ClassificationEditor({
  path,
  courses,
  onChange,
}: {
  path: string[];
  courses: CourseListItem[];
  onChange: (path: string[]) => void;
}) {
  const id = useId();
  const { categories } = useCatalog().data!;
  const paths = courses.map(getClassificationPath);
  categories
    .filter((item) => item.field === "category")
    .forEach((root) => {
      paths.push([String(root.value)]);
      categories
        .filter(
          (item) => item.parentId === root.id && item.field === "courseType",
        )
        .forEach((item) =>
          paths.push([String(root.value), String(item.value)]),
        );
    });
  const visiblePath = path.length < 2 ? [path[0] ?? "", ""] : path;
  return (
    <fieldset className="min-w-0 rounded-lg border border-[#e4e5eb] bg-white p-4">
      <legend className="px-2 font-semibold">과목 분류</legend>
      <p className="mb-3 text-[#858796]">
        기존 항목을 선택하거나 직접 입력하세요. 구분 → 이수 구분 → 영역 →
        하위 영역 1 → 하위 영역 2까지 최대 5단계로 추가할 수 있습니다.
      </p>
      <div className="space-y-3">
        {visiblePath.map((value, depth) => {
          const label =
            depth === 0
              ? "구분"
              : depth === 1
                ? "이수 구분"
                : depth === 2
                  ? "영역"
                  : `하위 영역 ${depth - 2}`;
          const options = [
            ...new Set(
              paths
                .filter((candidate) =>
                  visiblePath
                    .slice(0, depth)
                    .every(
                      (parent, index) => candidate[index] === parent.trim(),
                    ),
                )
                .map((candidate) => candidate[depth])
                .filter(Boolean),
            ),
          ];
          return (
            <div
              key={depth}
              className="flex items-end gap-2 border-l-2 border-[#d8cff9] pl-3"
              style={{ marginLeft: `${Math.min(depth, 6) * 12}px` }}
            >
              <label className="min-w-0 flex-1 space-y-1.5 text-[#5d6070]">
                <span className="block font-semibold">
                  {depth > 0 && <span aria-hidden="true">└ </span>}
                  {label}
                </span>
                <input
                  list={`${id}-${depth}`}
                  required
                  disabled={depth > 0 && !visiblePath[depth - 1].trim()}
                  className="w-full min-w-0 rounded-md border border-[#dddfe6] px-3 py-2 text-[11px] disabled:bg-[#f5f6f9]"
                  placeholder={`${label} 선택 또는 입력`}
                  value={value}
                  onChange={(event) =>
                    onChange([
                      ...visiblePath.slice(0, depth),
                      event.target.value,
                    ])
                  }
                />
                <datalist id={`${id}-${depth}`}>
                  {options.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
              {depth >= 2 && (
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-[#dddfe6] px-3 py-2 text-[#777a89]"
                  onClick={() => onChange(visiblePath.slice(0, depth))}
                  aria-label={`${label} 및 하위 분류 삭제`}
                >
                  하위 포함 삭제
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        disabled={
          visiblePath.length >= MAX_CLASSIFICATION_DEPTH ||
          visiblePath.some((value) => !value.trim())
        }
        className="mt-3 rounded-md border border-[#d8cff9] px-3 py-2 font-semibold text-[#7658e9] disabled:opacity-40"
        onClick={() => {
          if (visiblePath.length < MAX_CLASSIFICATION_DEPTH)
            onChange([...visiblePath, ""]);
        }}
      >
        {visiblePath.length >= MAX_CLASSIFICATION_DEPTH
          ? "최대 5단계까지 추가 가능"
          : "+ 하위 분류 추가"}
      </button>
    </fieldset>
  );
}
