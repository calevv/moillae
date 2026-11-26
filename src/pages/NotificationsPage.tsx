import type { ReactNode } from "react";
import { Link } from "react-router";
import NotificationList from "@/components/NotificationList";
import { useNotificationViews } from "@/hooks/useNotifications";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { toast } from "@/stores/useToastStore";

function NotificationsPage() {
  const authStatus = useAuthStore((s) => s.status);
  const status = useNotificationStore((s) => s.status);
  const load = useNotificationStore((s) => s.load);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const views = useNotificationViews();
  const unreadCount = views.filter((v) => !v.readAt).length;

  async function handleMarkAllRead() {
    try {
      await markAllRead();
    } catch {
      toast.error("읽음 처리를 하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  let body: ReactNode;
  if (authStatus === "demo") {
    body = (
      <Message>
        둘러보기에서는 알림이 없어요.
        <br />
        로그인하면 새 투표와 확정 소식이 여기에 모여요.
      </Message>
    );
  } else if (status === "error") {
    body = (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-[15px] text-subtext">알림을 불러오지 못했어요.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="h-11 rounded-full border-[1.5px] border-plum px-5 text-sm font-bold"
        >
          다시 시도
        </button>
      </div>
    );
  } else if (status !== "ready") {
    body = <Message>알림을 불러오는 중이에요.</Message>;
  } else if (views.length === 0) {
    body = (
      <Message>
        아직 알림이 없어요.
        <br />새 투표나 시간 확정이 생기면 여기에 모여요.
      </Message>
    );
  } else {
    body = (
      <NotificationList views={views} onOpen={(id) => void markRead(id)} />
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 pt-5 pb-10">
      <Link
        to="/home"
        aria-label="홈으로"
        className="-ml-2.5 flex size-11 items-center justify-center"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Link>

      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
          알림
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="min-h-11 px-2 text-sm font-bold text-subtext"
          >
            모두 읽음
          </button>
        )}
      </div>
      {unreadCount > 0 && (
        <p className="mt-1 text-sm text-subtext">
          안 읽은 알림 {unreadCount}개
        </p>
      )}

      <div className="mt-4">{body}</div>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) {
  return (
    <p className="py-12 text-center text-[15px] leading-relaxed text-subtext">
      {children}
    </p>
  );
}

export default NotificationsPage;
