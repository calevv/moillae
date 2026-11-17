import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Group, Poll, VoteResponse } from "@/types/poll";

// 데모 모드는 화면에서만 바뀌고 서버에는 저장하지 않음
const isDemo = () => useAuthStore.getState().status === "demo";

// "2026-12-19" + "19:00" → 이 브라우저 시간대(한국) 기준 절대 시각
function toStartsAt(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

// 응답: 가능/불가능은 저장(있으면 덮어쓰기), 미응답은 줄 지우기
export async function saveResponse(
  _pollId: string,
  optionId: string,
  userId: string,
  value: VoteResponse,
) {
  if (isDemo()) return;

  if (value === "pending") {
    const { error } = await supabase
      .from("responses")
      .delete()
      .eq("option_id", optionId)
      .eq("user_id", userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("responses").upsert(
    {
      option_id: optionId,
      user_id: userId,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "option_id,user_id" },
  );
  if (error) throw error;
}

// 확정: 방장만 가능 (RLS가 막음)
export async function saveConfirmation(pollId: string, optionId: string) {
  if (isDemo()) return;

  const { data, error } = await supabase
    .from("polls")
    .update({ confirmed_option_id: optionId })
    .eq("id", pollId)
    .select("id");
  if (error) throw error;
  // RLS에 막히면 에러 없이 "0줄 바뀜"으로 끝나요 → 직접 실패로 처리
  if (!data || data.length === 0) throw new Error("not_allowed");
}

// 모임 제안: 투표 + 후보를 한 번에 (앱이 만든 id 그대로)
export async function savePoll(poll: Poll) {
  if (isDemo()) return;

  const { error } = await supabase.rpc("create_poll", {
    p_poll_id: poll.id,
    p_group_id: poll.groupId,
    p_title: poll.title,
    p_option_ids: poll.options.map((o) => o.id),
    p_starts_at: poll.options.map((o) => toStartsAt(o.date, o.time)),
  });
  if (error) throw error;
}

// 그룹 만들기: 그룹 + 나(owner)를 한 번에. 초대 코드를 돌려줌
export async function saveGroup(group: Group): Promise<string | null> {
  if (isDemo()) return null;

  const { data, error } = await supabase.rpc("create_group", {
    p_group_id: group.id,
    p_name: group.name,
  });
  if (error) throw error;
  return data as string;
}

// 초대 코드로 그룹 참여. 참여한 그룹 id를 돌려줘요 (이미 멤버여도 그 그룹 id)
export async function joinGroupByCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("join_group_by_code", {
    p_code: code,
  });
  if (error) {
    if (error.message.includes("invalid_invite_code"))
      throw new Error("invalid_invite_code");
    throw error;
  }
  return data as string;
}

export type InvitePreview = {
  groupId: string;
  groupName: string;
  memberCount: number;
  isMember: boolean;
};

type InvitePreviewRow = {
  group_id: string;
  group_name: string;
  member_count: number;
  is_member: boolean;
};

// 초대 코드로 그룹 이름, 인원, 내가 멤버인지 미리 보기 (로그인 안 해도 됨)
export async function getInvitePreview(
  code: string,
): Promise<InvitePreview | null> {
  const { data, error } = await supabase
    .rpc("get_invite_preview", { p_code: code })
    .maybeSingle<InvitePreviewRow>();
  if (error) throw error;
  if (!data) return null; // 없는 코드
  return {
    groupId: data.group_id,
    groupName: data.group_name,
    memberCount: data.member_count,
    isMember: data.is_member,
  };
}
