import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { useCourseCatalogStore } from "../../store/courseCatalogStore";

export function PdfLink({ file }: { file: File }) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(
      new Blob([file], { type: "application/pdf" }),
    );
    if (link.current) link.current.href = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <a
      ref={link}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-[10px] font-semibold text-[#7658e9] underline underline-offset-2"
      aria-label={`강의계획서 보기: ${file.name} (새 탭)`}
    >
      <FileText size={14} className="shrink-0" />
      강의계획서 보기 · {file.name}
    </a>
  );
}

export default function SyllabusLink({ courseId }: { courseId: number }) {
  const file = useCourseCatalogStore((state) => state.syllabi[courseId]);
  return file ? (
    <PdfLink file={file} />
  ) : (
    <span className="mt-2 block text-[9px] text-[#9699a7]">
      등록된 강의계획서가 없습니다.
    </span>
  );
}
