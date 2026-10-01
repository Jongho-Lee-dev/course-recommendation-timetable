import type { Dispatch, SetStateAction } from "react";
import { createCourseFilters } from "../../data/CourseFilters";
import type { CourseFilter, CourseFilterOption } from "../../types/database";

type CourseFiltersProps = {
  filters?: CourseFilter[];
  keyword: string;
  setKeyword: Dispatch<SetStateAction<string>>;

  professorKeyword: string;
  setProfessorKeyword: Dispatch<SetStateAction<string>>;

  selectedFilters: Record<number, number[]>;
  setSelectedFilters: Dispatch<
    SetStateAction<Record<number, number[]>>
  >;

  onReset: () => void;
};

const selectClassName =
  "min-w-[90px] rounded-md border border-[#dddfe6] bg-white px-[9px] py-2 text-[10px] text-[#5d6070] outline-none transition focus:border-[#a99aed]";

const inputClassName =
  "min-w-0 rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#5d6070] outline-none placeholder:text-[#a0a3b0] focus:border-[#a99aed]";

type FilterSelectProps = {
  options: CourseFilterOption[];
  selectedPath: number[];
  onChange: (path: number[]) => void;
};

function FilterSelect({
  options,
  selectedPath,
  onChange,
}: FilterSelectProps) {
  const selectedId = selectedPath[0] ?? null;

  const selectedOption =
    options.find((option) => option.id === selectedId) ?? null;

  return (
    <div className="flex flex-wrap gap-[6px]">
      <button
        type="button"
        className={`rounded-md border px-3 py-2 text-[10px] transition ${selectedId === null || selectedId === 0
            ? "border-[#7658e9] bg-[#7658e9] text-white"
            : "border-[#dddfe6] bg-white text-[#777a89]"
          }`}
        onClick={() => onChange([0])}
      >
        전체
      </button>

      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`rounded-md border px-3 py-2 text-[10px] transition ${selectedId === option.id
              ? "border-[#7658e9] bg-[#7658e9] text-white"
              : "border-[#dddfe6] bg-white text-[#777a89]"
            }`}
          onClick={() => onChange([option.id])}
        >
          {option.name}
        </button>
      ))}

      {selectedOption?.children && (
        <div className="w-full pl-4">
          <FilterSelect
            options={selectedOption.children}
            selectedPath={selectedPath.slice(1)}
            onChange={(childPath) => {
              onChange([selectedOption.id, ...childPath]);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default function CourseFilters({
  filters,
  keyword,
  setKeyword,
  professorKeyword,
  setProfessorKeyword,
  selectedFilters,
  setSelectedFilters,
  onReset,
}: CourseFiltersProps) {
  const courseFilters = filters ?? createCourseFilters();
  // 버튼 표시와 실제 검색 조건이 항상 같은 상태를 사용한다.
  const activeFilterId = courseFilters.find(
    (filter) => !filter.isFixed && selectedFilters[filter.id]?.length,
  )?.id ?? null;

  const handleFilterChange = (
    filterId: number,
    path: number[],
  ) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: path,
    }));
  };

  const handleReset = () => {
    setSelectedFilters({});
    onReset();
  };

  const handleFilterToggle = (filterId: number) => {
    setSelectedFilters((prev) => {
      const next = { ...prev };
      // 분류를 해제하거나 전환할 때 하위 조건도 함께 제거한다.
      // 학년, 요일, 수업 형태 등 독립적인 조건은 유지한다.
      courseFilters.filter((filter) => !filter.isFixed).forEach((filter) => {
        delete next[filter.id];
      });
      if (!prev[filterId]?.length) next[filterId] = [0];
      return next;
    });
  };

  const dynamicFilters = courseFilters.filter(
    (filter) => !filter.isFixed,
  );

  const fixedFilters = courseFilters.filter(
    (filter) => filter.isFixed,
  );

  return (
    <div className="space-y-3 px-[18px] py-4">
      <div className="flex flex-wrap items-center gap-[6px]">
        <input
          className={inputClassName}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="강좌명 또는 학수번호 검색"
        />

        <input
          className={inputClassName}
          value={professorKeyword}
          onChange={(e) => setProfessorKeyword(e.target.value)}
          placeholder="교수명 검색"
        />

        <button
          type="button"
          className="rounded-md border border-[#dddfe6] bg-white px-3 py-2 text-[10px] text-[#777a89] transition hover:bg-[#fafafd]"
          onClick={handleReset}
        >
          초기화
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-[6px]">
          {dynamicFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={activeFilterId === filter.id}
              className={`rounded-md border px-3 py-2 text-[10px] font-semibold transition ${activeFilterId === filter.id
                  ? "border-[#7658e9] bg-[#7658e9] text-white"
                  : "border-[#dddfe6] bg-white text-[#777a89] hover:bg-[#fafafd]"
                }`}
              onClick={() => handleFilterToggle(filter.id)}
            >
              {filter.name}
            </button>
          ))}
        </div>

        {activeFilterId !== null && (
          <div className="pl-3">
            {dynamicFilters
              .filter((filter) => filter.id === activeFilterId)
              .map((filter) => (
                <FilterSelect
                  key={filter.id}
                  options={filter.options}
                  selectedPath={selectedFilters[filter.id] ?? []}
                  onChange={(path) =>
                    handleFilterChange(filter.id, path)
                  }
                />
              ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-[6px]">
        {fixedFilters.map((filter) => {
          const hasNestedOptions = filter.options.some(
            (option) => option.children?.length,
          );

          if (hasNestedOptions) {
            return (
              <div key={filter.id} className="w-full space-y-2">
                <span className="text-[10px] text-[#777a89]">
                  {filter.name}
                </span>
                <FilterSelect
                  options={filter.options}
                  selectedPath={selectedFilters[filter.id] ?? []}
                  onChange={(path) =>
                    setSelectedFilters((prev) => ({
                      ...prev,
                      [filter.id]: path,
                    }))
                  }
                />
              </div>
            );
          }

          return (
            <select
              key={filter.id}
              className={selectClassName}
              value={selectedFilters[filter.id]?.[0] ?? ""}
              onChange={(e) => {
                const value = e.target.value;

                setSelectedFilters((prev) => ({
                  ...prev,
                  [filter.id]: value ? [Number(value)] : [],
                }));
              }}
            >
              <option value="">{filter.name}</option>

              {filter.options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          );
        })}
      </div>
    </div>
  );
}
