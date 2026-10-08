import { useEffect, useRef } from "react";
import type { Department } from "../../shared/types/database";

type DepartmentNode = {
  key: string;
  label: string;
  departmentIds: number[];
  children: DepartmentNode[];
};

function buildTree(departments: Department[]): DepartmentNode[] {
  const roots: DepartmentNode[] = [];
  for (const department of departments) {
    const levels = [
      ...(department.collegeName
        ? [
            {
              key: `college:${department.collegeName}`,
              label: department.collegeName,
            },
          ]
        : []),
      ...(department.facultyName
        ? [
            {
              key: `faculty:${department.facultyName}`,
              label: department.facultyName,
            },
          ]
        : []),
      { key: `department:${department.id}`, label: department.majorName },
    ];
    let siblings = roots;
    for (const level of levels) {
      let node = siblings.find((item) => item.key === level.key);
      if (!node) {
        node = { ...level, departmentIds: [], children: [] };
        siblings.push(node);
      }
      if (!node.departmentIds.includes(department.id))
        node.departmentIds.push(department.id);
      siblings = node.children;
    }
  }
  return roots;
}

function DepartmentBranch({
  node,
  selected,
  onToggle,
}: {
  node: DepartmentNode;
  selected: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const count = node.departmentIds.filter((id) => selected.has(id)).length;
  const checked = count === node.departmentIds.length;
  const mixed = count > 0 && !checked;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = mixed;
  }, [mixed]);
  const checkbox = (
    <label className="inline-flex cursor-pointer items-center gap-2 py-1.5">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        aria-checked={mixed ? "mixed" : checked}
        className="accent-[#7658e9]"
        onChange={(event) => onToggle(node.departmentIds, event.target.checked)}
      />
      <span>{node.label}</span>
      {node.children.length > 0 && (
        <span className="text-[#858796]">
          ({count}/{node.departmentIds.length})
        </span>
      )}
    </label>
  );
  return (
    <li>
      {node.children.length > 0 ? (
        <details open>
          <summary className="cursor-pointer">{checkbox}</summary>
          <ul className="ml-2 border-l border-[#dddfe6] pl-4">
            {node.children.map((child) => (
              <DepartmentBranch
                key={child.key}
                node={child}
                selected={selected}
                onToggle={onToggle}
              />
            ))}
          </ul>
        </details>
      ) : (
        checkbox
      )}
    </li>
  );
}

export default function DepartmentTreeSelect({
  departments,
  selectedIds,
  onChange,
}: {
  departments: Department[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const selected = new Set(selectedIds);
  const toggle = (ids: number[], checked: boolean) => {
    const next = new Set(selectedIds);
    ids.forEach((id) => {
      if (checked) next.add(id);
      else next.delete(id);
    });
    onChange([...next]);
  };
  return (
    <div className="space-y-3 text-[#5d6070]">
      <div className="flex flex-wrap items-center gap-3">
        <span>선택된 학과 {selected.size}개</span>
        <button
          type="button"
          className="text-[#7658e9]"
          onClick={() => onChange(departments.map((item) => item.id))}
        >
          전체 선택
        </button>
        <button
          type="button"
          className="text-[#777a89]"
          onClick={() => onChange([])}
        >
          전체 해제
        </button>
      </div>
      <ul className="max-h-72 overflow-auto rounded-md border border-[#dddfe6] bg-white p-3">
        {buildTree(departments).map((node) => (
          <DepartmentBranch
            key={node.key}
            node={node}
            selected={selected}
            onToggle={toggle}
          />
        ))}
      </ul>
      {departments.length === 0 && <p>등록된 학과가 없습니다.</p>}
    </div>
  );
}
