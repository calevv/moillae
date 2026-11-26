import { useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import {
  toNotificationView,
  type NotificationView,
} from "@/utils/notification";

// 알림 + 그룹·투표를 합쳐 화면에 보여 줄 목록을 만들어요
export function useNotificationViews(): NotificationView[] {
  const items = useNotificationStore((s) => s.items);
  const groups = useAppStore((s) => s.groups);
  const polls = useAppStore((s) => s.polls);

  return useMemo(
    () =>
      items
        .map((n) => toNotificationView(n, groups, polls))
        .filter((v): v is NotificationView => v !== null),
    [items, groups, polls],
  );
}

// 숨겨진 알림은 세지 않도록, 보이는 목록 기준으로 세요
export function useUnreadCount(): number {
  const views = useNotificationViews();
  return views.filter((v) => !v.readAt).length;
}
