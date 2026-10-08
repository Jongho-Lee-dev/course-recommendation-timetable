import { ArrowUp, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#e7e8ee] bg-white">
      <div className="mx-auto max-w-[1500px] px-4 pb-5 pt-7 min-[1101px]:px-7">
        <div
          className="
            flex flex-col gap-6
            min-[901px]:flex-row min-[901px]:items-start
            min-[901px]:justify-between
          "
        >
          <div>
            <Link
              to="/mainPage"
              className="
                inline-flex items-center gap-2.5 rounded-lg
                focus-visible:outline-2 focus-visible:outline-offset-4
                focus-visible:outline-[#7658e9]
              "
            >
              <span
                className="
                  grid h-9 w-9 place-items-center rounded-xl
                  bg-[#f0edff] text-[#7658e9]
                "
              >
                <BookOpen size={18} aria-hidden="true" />
              </span>
              <span
                className="
                  text-sm font-extrabold tracking-[-0.5px] text-[#242331]
                "
              >
                수강 신청
              </span>
            </Link>
            <p className="mt-3 text-[11px] leading-6 text-[#777985]">
              배우고 싶은 강의부터 나만의 시간표까지.
              <br />
              새로운 학기의 시작을 함께합니다.
            </p>
          </div>
        </div>

        <div
          className="
            mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2
            border-t border-[#f0f0f4] pt-3
          "
        >
          <p className="text-[10px] leading-5 text-[#777985]">
            © {new Date().getFullYear()} 수강 신청. All rights reserved.
          </p>
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            className="
              inline-flex min-h-11 items-center gap-2 rounded-lg px-3
              text-[10px] font-semibold text-[#777985] transition-colors
              hover:bg-[#f0edff] hover:text-[#7658e9]
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-[#7658e9]
            "
          >
            맨 위로
            <ArrowUp size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
