import { useEffect } from "react";
import { Outlet } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";

function RootLayout() {
  useEffect(() => {
    const startAuthListener = useAuthStore.getState().startAuthListener;
    const stopListening = startAuthListener();
    return stopListening;
  }, []);

  return <Outlet />;
}

export default RootLayout;
