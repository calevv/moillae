import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";

function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    const startAuthListener = useAuthStore.getState().startAuthListener;
    const stopListening = startAuthListener();
    return stopListening;
  }, []);

  // 로그인 상태가 바뀌면 그에 맞는 데이터로 갈아 끼워요
  useEffect(() => {
    const app = useAppStore.getState();
    if (status === "signedIn") void app.loadFromServer();
    else if (status === "demo") app.loadDemo();
    else if (status === "signedOut") app.resetData();
    // "loading"(로그인 처리 중)일 때는 아무것도 안 해요
  }, [status, userId]);

  return <Outlet />;
}

export default RootLayout;
