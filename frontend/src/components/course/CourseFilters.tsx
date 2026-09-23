import { useState, type Dispatch, type SetStateAction } from "react";
import { createCourseFilters } from "../../data/CourseFilters";
import type { CourseFilterOption } from "../../types/database";

type CourseFiltersProps = {
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
        className={`rounded-md border px-3 py-2 text-[10px] transition ${
          selectedId === null
            ? "border-[#7658e9] bg-[#7658e9] text-white"
            : "border-[#dddfe6] bg-white text-[#777a89]"
        }`}
        onClick={() => onChange([])}
      >
        전체
      </button>

      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`rounded-md border px-3 py-2 text-[10px] transition ${
            selectedId === option.id
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
  keyword,
  setKeyword,
  professorKeyword,
  setProfessorKeyword,
  selectedFilters,
  setSelectedFilters,
  onReset,
}: CourseFiltersProps) {
  const [activeFilterId, setActiveFilterId] = useState<number | null>(
    null,
  );

  const courseFilters = createCourseFilters();

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
    setActiveFilterId(null);
    onReset();
  };

  const handleFilterToggle = (filterId: number) => {
    setActiveFilterId((prev) => {
      if (prev === filterId) {
        return null;
      }

      setSelectedFilters({});
      return filterId;
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
              className={`rounded-md border px-3 py-2 text-[10px] font-semibold transition ${
                activeFilterId === filter.id
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
        {fixedFilters.map((filter) => (
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
        ))}
      </div>
    </div>
  );
}