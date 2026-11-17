import { useSearchParams } from "react-router";
import { safeNext } from "@/utils/next";

// 주소의 ?next= 값을 검사해서 돌려줘요 (없거나 위험하면 null)
export function useNextPath(): string | null {
  const [params] = useSearchParams();
  return safeNext(params.get("next"));
}
