import { useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";

// 바뀌면 화면에 반영할 테이블 (DB에서 supabase_realtime에 넣은 것과 같아야 해요)
const TABLES = [
  "groups",
  "group_members",
  "polls",
  "poll_options",
  "responses",
] as const;

// 친구가 후보 4개에 연달아 응답하면 알림이 4개 와요 → 마지막 알림 뒤 0.5초 기다렸다가 한 번만
const DEBOUNCE_MS = 500;

type Row = Record<string, unknown>;

// 지우기(DELETE) 알림은 RLS가 적용되지 않아서 다른 그룹 것도 와요.
// id로 알 수 있는 테이블은 내 스토어에 있는 것만 반영하고, 확인할 수 없으면 그냥 다시 받아요
function isMine(table: string, old: Partial<Row>): boolean {
  const id = typeof old.id === "string" ? old.id : undefined;
  if (!id) return true;

  const { groups, polls } = useAppStore.getState();
  if (table === "groups") return id in groups;
  if (table === "polls") return id in polls;
  if (table === "poll_options") {
    return Object.values(polls).some((p) => p.options.some((o) => o.id === id));
  }
  return true;
}

// 로그인한 동안 DB 변경을 구독하고, 바뀌면 데이터를 조용히 다시 받음
export function useRealtimeSync() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    // 데모와 로그아웃 상태는 서버 데이터가 없어서 구독하지 않음
    if (status !== "signedIn" || !userId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        useAppStore
          .getState()
          .reloadData()
          .catch((e: unknown) => console.error("실시간 갱신 실패", e));
      }, DEBOUNCE_MS);
    };

    const onChange = (payload: RealtimePostgresChangesPayload<Row>) => {
      if (payload.eventType === "DELETE" && !isMine(payload.table, payload.old))
        return;
      refresh();
    };

    // 테이블마다 구독을 걸고 연결 시작
    let channel = supabase.channel(`moillae-sync-${userId}`);
    for (const table of TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "moillae", table },
        onChange,
      );
    }
    channel.subscribe();

    // 휴대폰에서 다른 앱에 갔다 오면 연결이 끊겨 있었을 수 있어서, 돌아오면 한 번 다시 받기
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    // 로그아웃하거나 계정이 바뀌면 정리
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [status, userId]);
}
