import { Link } from "react-router";
import type { Member, Poll } from "@/types/poll";
import { formatDate, formatTime } from "@/utils/date";
import { countYes, getTopOption, needsMyResponse } from "@/utils/poll";

type PollSummaryCardProps = {
  poll: Poll;
  members: Member[];
  currentUserId: string;
};

export default function PollSummaryCard({
  poll,
  members,
  currentUserId,
}: PollSummaryCardProps) {
  const to = `/groups/${poll.groupId}/polls/${poll.id}`;
  const confirmed = poll.options.find((o) => o.id === poll.confirmedOptionId);

  // 확정된 투표
  if (confirmed) {
    return (
      <Link to={to} className="flex flex-col gap-2.5 rounded-3xl bg-cream p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[19px] font-bold tracking-tight">
            {poll.title}
          </span>
          <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-plum pr-2.5 pl-2 text-[13px] font-bold text-white">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            확정
          </span>
        </div>
        <span className="text-sm font-bold">
          {formatDate(confirmed.date)} {formatTime(confirmed.time)}
        </span>
      </Link>
    );
  }

  // 투표 중
  const isAnswered = (memberId: string) =>
    poll.options.some(
      (o) => (o.responses[memberId] ?? "pending") !== "pending",
    );
  const respondedCount = members.filter((m) => isAnswered(m.id)).length;
  const top = getTopOption(poll.options, members);
  const needs = needsMyResponse(poll, currentUserId);

  return (
    <Link to={to} className="flex flex-col gap-3 rounded-3xl bg-cream p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[19px] font-bold tracking-tight">
          {poll.title}
        </span>
        <span className="inline-flex h-[26px] items-center rounded-full bg-peach px-2.5 text-[13px] font-bold">
          투표 중
        </span>
      </div>
      <div className="flex flex-col gap-1 text-sm text-subtext">
        <span>
          후보 {poll.options.length}개 · {members.length}명 중 {respondedCount}
          명 응답
        </span>
        <span className="font-bold text-plum">
          가장 많은 시간 {formatDate(top.date)} {formatTime(top.time)} ·{" "}
          {countYes(top, members)}/{members.length}명
        </span>
      </div>
      {needs && (
        <span className="inline-flex h-8 items-center gap-1.5 self-start rounded-full bg-plum px-3 text-[13px] font-bold text-white">
          <span className="size-2 rounded-full bg-coral" aria-hidden="true" />내
          응답이 필요해요
        </span>
      )}
    </Link>
  );
}
