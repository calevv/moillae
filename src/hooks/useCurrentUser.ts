import { CURRENT_USER_ID } from "@/data/dummy";

// 나중에 로그인 정보에서 꺼내도록 이 안쪽만 바꿈
export function useCurrentUser() {
  return CURRENT_USER_ID;
}
