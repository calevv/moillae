import type { AppNotification, NotificationType } from "@/types/notification";
import type { Group, Poll } from "@/types/poll";
import { formatDate, formatTime } from "@/utils/date";

export type NotificationView = AppNotification & {
  label: string;
  message: string;
  groupName: string;
  href: string;
};

const LABELS: Record<NotificationType, string> = {
  poll_created: "새 투표",
  poll_confirmed: "시간 확정",
  poll_unconfirmed: "확정 취소",
};

function buildMessage(type: NotificationType, poll: Poll): string {
  switch (type) {
    case "poll_created":
      return `${poll.title} 후보 ${poll.options.length}개가 올라왔어요`;
    case "poll_confirmed": {
      const option = poll.options.find((o) => o.id === poll.confirmedOptionId);
      return option
        ? `${poll.title} 시간이 ${formatDate(option.date)} ${formatTime(option.time)}로 확정됐어요`
        : `${poll.title} 시간이 확정됐어요`;
    }
    case "poll_unconfirmed":
      return `${poll.title} 확정이 취소됐어요. 다시 투표해 주세요`;
  }
}

// 문구는 저장하지 않고, 앱이 가진 그룹·투표에서 찾아 만들어요
export function toNotificationView(
  notification: AppNotification,
  groups: Record<string, Group>,
  polls: Record<string, Poll>,
): NotificationView | null {
  const group = groups[notification.groupId];
  const poll = notification.pollId ? polls[notification.pollId] : undefined;
  // 나간 그룹이거나 아직 데이터가 오기 전이면 숨겨요
  if (!group || !poll) return null;

  return {
    ...notification,
    label: LABELS[notification.type],
    message: buildMessage(notification.type, poll),
    groupName: group.name,
    href: `/groups/${group.id}/polls/${poll.id}`,
  };
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatRelativeTime(iso: string, now: Date): string {
  const time = new Date(iso);
  const minutes = Math.floor((now.getTime() - time.getTime()) / 60_000);

  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (isSameLocalDay(time, now)) return `${Math.floor(minutes / 60)}시간 전`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameLocalDay(time, yesterday)) return "어제";

  return `${time.getMonth() + 1}/${time.getDate()}`;
}
