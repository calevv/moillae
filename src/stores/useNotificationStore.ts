import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { fetchNotifications, saveReadAt } from "@/api/notifications";
import type { AppNotification } from "@/types/notification";

type LoadStatus = "idle" | "loading" | "ready" | "error";

type NotificationState = {
  items: AppNotification[];
  status: LoadStatus;
  load: () => Promise<void>;
  add: (notification: AppNotification) => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
};

// 늦게 도착한 옛 응답을 버리기 위한 번호 (로그아웃하거나 다시 불러오면 올라가요)
let loadSeq = 0;

function setReadAt(
  items: AppNotification[],
  ids: Set<string>,
  readAt: string | null,
): AppNotification[] {
  return items.map((n) => (ids.has(n.id) ? { ...n, readAt } : n));
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      items: [],
      status: "idle",

      load: async () => {
        const seq = ++loadSeq;
        // 이미 목록을 보여 주는 중이면 로딩 화면 없이 조용히 다시 불러와요
        if (get().status !== "ready") set({ status: "loading" });

        try {
          const fetched = await fetchNotifications();
          if (seq !== loadSeq) return;

          // 불러오는 사이에 실시간으로 들어온 알림은 지우지 않고 앞에 남겨요
          const fetchedIds = new Set(fetched.map((n) => n.id));
          const newest = fetched[0] ? Date.parse(fetched[0].createdAt) : 0;
          set((s) => ({
            items: [
              ...s.items.filter(
                (n) =>
                  !fetchedIds.has(n.id) && Date.parse(n.createdAt) > newest,
              ),
              ...fetched,
            ],
            status: "ready",
          }));
        } catch (error) {
          if (seq !== loadSeq) return;
          console.error(error);
          if (get().status !== "ready") set({ status: "error" });
        }
      },

      add: (notification) =>
        set((s) =>
          s.items.some((n) => n.id === notification.id)
            ? s
            : { items: [notification, ...s.items] },
        ),

      markRead: async (id) => {
        const target = get().items.find((n) => n.id === id);
        if (!target || target.readAt) return;

        const ids = new Set([id]);
        const readAt = new Date().toISOString();
        set((s) => ({ items: setReadAt(s.items, ids, readAt) }));
        try {
          await saveReadAt([id], readAt);
        } catch (error) {
          console.error(error);
          set((s) => ({ items: setReadAt(s.items, ids, null) }));
        }
      },

      markAllRead: async () => {
        const unreadIds = get()
          .items.filter((n) => !n.readAt)
          .map((n) => n.id);
        if (unreadIds.length === 0) return;

        const ids = new Set(unreadIds);
        const readAt = new Date().toISOString();
        set((s) => ({ items: setReadAt(s.items, ids, readAt) }));
        try {
          await saveReadAt(unreadIds, readAt);
        } catch (error) {
          set((s) => ({ items: setReadAt(s.items, ids, null) }));
          throw error; // 화면에서 토스트로 알려요
        }
      },

      clear: () => {
        loadSeq++;
        set({ items: [], status: "idle" });
      },
    }),
    { name: "notifications" },
  ),
);
