import { NavLink } from "react-router";

const base = "flex flex-col items-center justify-center gap-1 text-xs";

export default function BottomNav() {
  return (
    <nav aria-label="하단 메뉴" className="grid h-[68px] grid-cols-2">
      <NavLink
        to="/home"
        className={({ isActive }) =>
          `${base} ${isActive ? "font-bold text-plum" : "font-medium text-subtext"}`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-[30px] w-14 items-center justify-center rounded-full ${isActive ? "bg-peach" : ""}`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 11l8-6.5 8 6.5v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
              </svg>
            </span>
            홈
          </>
        )}
      </NavLink>

      <NavLink
        to="/calendar"
        className={({ isActive }) =>
          `${base} ${isActive ? "font-bold text-plum" : "font-medium text-subtext"}`
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-[30px] w-14 items-center justify-center rounded-full ${isActive ? "bg-peach" : ""}`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="5.5" width="16" height="14" rx="3" />
                <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
              </svg>
            </span>
            달력
          </>
        )}
      </NavLink>
    </nav>
  );
}
