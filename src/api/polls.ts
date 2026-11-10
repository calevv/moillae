import type { Poll, VoteResponse } from "@/types/poll";

// 응답 저장.
export async function saveResponse(
  pollId: string,
  optionId: string,
  userId: string,
  value: VoteResponse,
): Promise<void> {
  // 아직 쓰지 않는 값이라 경고가 나지 않게 표시만
  void pollId;
  void optionId;
  void userId;
  void value;
}

// 확정 저장. 나중에 Supabase 코드로 바꿈
export async function saveConfirmation(
  pollId: string,
  optionId: string,
): Promise<void> {
  void pollId;
  void optionId;
}

export async function savePoll(poll: Poll): Promise<void> {
  void poll;
}
