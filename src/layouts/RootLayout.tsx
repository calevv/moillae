import { useEffect } from "react";
import { Outlet } from "react-router";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toaster from "@/components/Toaster";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";

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

  return (
    <>
      <Outlet />
      <ConfirmDialog />
      <Toaster />
    </>
  );
}

export default RootLayout;
