import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";

function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") {
    return <p className="p-5 text-center text-subtext">불러오는 중이에요…</p>;
  }
  if (status === "signedOut") {
    // 로그인 후 원래 가려던 곳으로 돌아오게 주소를 같이 넘겨요
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export default RequireAuth;
