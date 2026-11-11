import { Navigate, Outlet, useLocation } from "react-router";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";

function RequireAuth() {
  const status = useAuthStore((s) => s.status);
  const dataStatus = useAppStore((s) => s.dataStatus);
  const loadFromServer = useAppStore((s) => s.loadFromServer);
  const location = useLocation();

  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (dataStatus === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center text-plum">
        <p className="text-[15px] text-subtext">
          모임 정보를 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => void loadFromServer()}
          className="h-12 rounded-full bg-coral px-6 text-[15px] font-bold"
        >
          다시 시도
        </button>
      </div>
    );
  }
  if (status === "loading" || dataStatus !== "ready") {
    return <p className="p-5 text-center text-subtext">불러오는 중이에요…</p>;
  }
  return <Outlet />;
}

export default RequireAuth;
