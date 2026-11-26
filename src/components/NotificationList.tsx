import { Link } from "react-router";
import {
  formatRelativeTime,
  isSameLocalDay,
  type NotificationView,
} from "@/utils/notification";

type NotificationListProps = {
  views: NotificationView[];
  onOpen: (id: string) => void;
};

// 알림 페이지에서 쓰고, 나중에 PC 드롭다운에서도 그대로 써요
function NotificationList({ views, onOpen }: NotificationListProps) {
  const now = new Date();
  const today = views.filter((v) => isSameLocalDay(new Date(v.createdAt), now));
  const earlier = views.filter(
    (v) => !isSameLocalDay(new Date(v.createdAt), now),
  );

  return (
    <div className="flex flex-col">
      {today.length > 0 && (
        <NotificationSection
          title="오늘"
          views={today}
          now={now}
          onOpen={onOpen}
        />
      )}
      {earlier.length > 0 && (
        <NotificationSection
          title="이전"
          views={earlier}
          now={now}
          onOpen={onOpen}
          divided={today.length > 0}
        />
      )}
    </div>
  );
}

type NotificationSectionProps = {
  title: string;
  views: NotificationView[];
  now: Date;
  onOpen: (id: string) => void;
  divided?: boolean;
};

function NotificationSection({
  title,
  views,
  now,
  onOpen,
  divided = false,
}: NotificationSectionProps) {
  return (
    <section className={divided ? "border-t border-line" : ""}>
      <h2 className="pt-3 pb-1 text-[13px] font-bold text-subtext">{title}</h2>
      <ul>
        {views.map((v) => {
          const unread = !v.readAt;
          return (
            <li key={v.id}>
              <Link
                to={v.href}
                onClick={() => onOpen(v.id)}
                className="flex gap-2.5 py-3"
              >
                {unread ? (
                  <span className="relative mt-[7px] size-2 flex-none rounded-full bg-plum">
                    <span className="sr-only">안 읽음</span>
                  </span>
                ) : (
                  <span className="w-2 flex-none" aria-hidden="true" />
                )}
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-xs font-bold text-subtext">
                    {v.label}
                  </span>
                  <span
                    className={`text-sm leading-normal ${unread ? "font-bold" : "font-medium"}`}
                  >
                    {v.message}
                  </span>
                  <span className="truncate text-[13px] text-subtext">
                    {v.groupName} · {formatRelativeTime(v.createdAt, now)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default NotificationList;
