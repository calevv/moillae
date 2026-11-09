import type { Member, TimeOption } from "@/types/poll";

// 이 후보 시간에 "가능"이라고 답한 멤버 수
export function countYes(option: TimeOption, members: Member[]): number {
  return members.filter((m) => option.responses[m.id] === "yes").length;
}
