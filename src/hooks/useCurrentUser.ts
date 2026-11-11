import { useAuthStore } from "@/stores/useAuthStore";

// 로그인한 사용자 id (데모면 "m1")
export function useCurrentUser() {
  return useAuthStore((s) => s.userId) ?? "";
}
