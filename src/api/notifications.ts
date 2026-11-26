import { supabase } from "@/lib/supabase";
import type { TableRow } from "@/types/dbHelpers";
import type { AppNotification, NotificationType } from "@/types/notification";

// 목록에 쓰는 칸만
const NOTIFICATION_COLUMNS = "id, type, group_id, poll_id, created_at, read_at";

type NotificationRow = Pick<
  TableRow<"notifications">,
  "id" | "type" | "group_id" | "poll_id" | "created_at" | "read_at"
>;

// 알림은 계속 쌓이니까 최근 것만 가져와요
const LIST_LIMIT = 50;

const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "poll_created",
  "poll_confirmed",
  "poll_unconfirmed",
];

// DB의 type은 text라서 앱이 아는 값인지 확인해서 좁힘 (check 제약은 생성 타입에 안 나와요)
function toNotificationType(value: string): NotificationType | null {
  return NOTIFICATION_TYPES.find((t) => t === value) ?? null;
}

export function toAppNotification(
  row: NotificationRow,
): AppNotification | null {
  const type = toNotificationType(row.type);
  if (!type) return null;
  return {
    id: row.id,
    type,
    groupId: row.group_id,
    pollId: row.poll_id,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  // 조건을 안 걸어도 RLS가 내 알림만 돌려줌
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);
  if (error) throw error;

  return data
    .map(toAppNotification)
    .filter((n): n is AppNotification => n !== null);
}

// 아직 안 읽은 것만 읽음 시각을 적음 (read_at 칸만 수정 권한이 있어요)
export async function saveReadAt(ids: string[], readAt: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: readAt })
    .in("id", ids)
    .is("read_at", null);
  if (error) throw error;
}
