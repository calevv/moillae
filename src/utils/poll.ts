import type { Member, Poll, TimeOption } from "@/types/poll";

// 이 후보 시간에 "가능"이라고 답한 멤버 수
export function countYes(option: TimeOption, members: Member[]): number {
  return members.filter((m) => option.responses[m.id] === "yes").length;
}

// 가능 인원이 가장 많은 후보 (동점이면 앞의 것)
export function getTopOption(
  options: TimeOption[],
  members: Member[],
): TimeOption {
  return options.reduce((best, o) =>
    countYes(o, members) > countYes(best, members) ? o : best,
  );
}

// 투표 중이고, 내가 아직 응답하지 않은 후보가 있으면 true
export function needsMyResponse(poll: Poll, userId: string): boolean {
  if (poll.confirmedOptionId) return false;
  return poll.options.some(
    (o) => (o.responses[userId] ?? "pending") === "pending",
  );
}
