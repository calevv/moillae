import { useEffect } from "react";
import { Outlet } from "react-router";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toaster from "@/components/Toaster";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { usePushSync } from "@/hooks/usePushSync";

function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => useAuthStore.getState().startAuthListener(), []);

  // 로그인 상태가 바뀌면 그에 맞는 데이터로 갈아 끼워요
  useEffect(() => {
    const app = useAppStore.getState();
    if (status === "signedIn") void app.loadFromServer();
    else if (status === "demo") app.loadDemo();
    else if (status === "signedOut") app.resetData();
  }, [status, userId]);

  // 로그인한 동안 DB 변경을 구독해서 친구의 투표 등을 바로 반영
  useRealtimeSync(); // 로그인하면 이 기기의 알림을 지금 계정으로 다시 연결
  usePushSync();

  return (
    <>
      <Outlet />
      <ConfirmDialog />
      <Toaster />
    </>
  );
}

export default RootLayout;
