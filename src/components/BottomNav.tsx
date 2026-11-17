import { Link, useLocation } from "react-router";

const base = "flex flex-col items-center justify-center gap-1 text-xs";

// 어떤 주소일 때 이 탭을 켤지 정해요
const isHomeTab = (path: string) =>
  path === "/home" || path.startsWith("/groups/");
const isCalendarTab = (path: string) => path === "/calendar";

export default function BottomNav() {
  const { pathname } = useLocation();

  const tabs = [
    {
      to: "/home",
      label: "홈",
      active: isHomeTab(pathname),
      icon: (
        <path d="M4 11l8-6.5 8 6.5v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
      ),
    },
    {
      to: "/calendar",
      label: "달력",
      active: isCalendarTab(pathname),
      icon: (
        <>
          <rect x="4" y="5.5" width="16" height="14" rx="3" />
          <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
        </>
      ),
    },
  ];

  return (
    <nav
      aria-label="하단 메뉴"
      className="grid h-tab-bar grid-cols-2 border-t border-line px-5"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          aria-current={tab.active ? "page" : undefined}
          className={`${base} ${tab.active ? "font-bold text-plum" : "font-medium text-subtext"}`}
        >
          <span
            className={`flex h-[30px] w-14 items-center justify-center rounded-full ${tab.active ? "bg-peach" : ""}`}
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
              {tab.icon}
            </svg>
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
