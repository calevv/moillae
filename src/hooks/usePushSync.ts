import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { reattachPush } from "@/utils/push";

// 로그인하면, 이 기기에 알림이 허락돼 있으면 지금 계정으로 다시 연결해요
export function usePushSync() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    if (status !== "signedIn" || !userId) return;
    reattachPush().catch((e: unknown) =>
      console.error("푸시 다시 연결 실패", e),
    );
  }, [status, userId]);
}
