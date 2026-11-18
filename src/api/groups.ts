import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

const isDemo = () => useAuthStore.getState().status === "demo";

// 그룹 이름 바꾸기 (RLS: 방장만)
export async function saveGroupName(groupId: string, name: string) {
  if (isDemo()) return;
  const { data, error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("not_allowed");
}

// 그룹 나가기 (방장이면 자동 위임)
export async function saveLeaveGroup(groupId: string) {
  if (isDemo()) return;
  const { error } = await supabase.rpc("leave_group", { p_group_id: groupId });
  if (error) {
    if (error.message.includes("last_member")) throw new Error("last_member");
    throw error;
  }
}

// 그룹 삭제 (RLS: 방장만). 멤버, 투표, 후보, 응답이 함께 지워져요 (on delete cascade)
export async function saveDeleteGroup(groupId: string) {
  if (isDemo()) return;
  const { data, error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("not_allowed");
}
