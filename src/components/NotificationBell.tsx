import { Link } from "react-router";
import { useUnreadCount } from "@/hooks/useNotifications";

function NotificationBell() {
  const unread = useUnreadCount();

  return (
    <Link
      to="/notifications"
      aria-label={unread > 0 ? `알림, 안 읽은 알림 ${unread}개` : "알림"}
      className="relative -mr-2.5 flex size-11 items-center justify-center"
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
        <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" />
      </svg>
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-[9px] right-[10px] box-content size-[9px] rounded-full border-2 border-white bg-coral"
        />
      )}
    </Link>
  );
}

export default NotificationBell;
