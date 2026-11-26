import { useEffect } from "react";
import { toAppNotification } from "@/api/notifications";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import type { TableRow } from "@/types/dbHelpers";

// 로그인하면 알림을 불러오고, 새 알림은 실시간으로 목록 맨 위에 넣어요
export function useNotificationSync() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    const store = useNotificationStore.getState();
    if (status !== "signedIn" || !userId) {
      store.clear(); // 로그아웃·데모에서는 비워요
      return;
    }

    void store.load();

    // 투표 데이터와 달리 알림은 "새로 생기기만" 해서, 온 행을 그대로 넣어요
    const channel = supabase
      .channel(`moillae-notifications-${userId}`)
      .on<TableRow<"notifications">>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "moillae",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = toAppNotification(payload.new);
          if (notification) useNotificationStore.getState().add(notification);
        },
      )
      .subscribe();

    // 다른 탭에 있는 동안 놓친 알림을 채워요
    function handleVisible() {
      if (document.visibilityState === "visible") {
        void useNotificationStore.getState().load();
      }
    }
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      void supabase.removeChannel(channel);
    };
  }, [status, userId]);
}
