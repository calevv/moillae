import { Link } from "react-router";
import type { Group, Member, Poll } from "@/types/poll";
import { formatDate } from "@/utils/date";
import { needsMyResponse } from "@/utils/poll";

type GroupCardProps = {
  group: Group;
  members: Member[]; // 이 그룹의 멤버
  polls: Poll[]; // 이 그룹의 투표
  currentUserId: string;
};

const MAX_AVATARS = 4;

export default function GroupCard({
  group,
  members,
  polls,
  currentUserId,
}: GroupCardProps) {
  const needsCount = polls.filter((p) =>
    needsMyResponse(p, currentUserId),
  ).length;

  // 대표로 보여 줄 모임: 투표 중인 것 먼저, 없으면 확정된 것
  const featured =
    polls.find((p) => !p.confirmedOptionId) ??
    polls.find((p) => p.confirmedOptionId);

  const confirmed = featured?.options.find(
    (o) => o.id === featured.confirmedOptionId,
  );

  // 아바타는 앞의 4명만, 나머지는 +N
  const shown = members.slice(0, MAX_AVATARS);
  const rest = members.length - shown.length;

  return (
    <Link
      to={`/groups/${group.id}`}
      className="flex flex-col gap-3.5 rounded-3xl bg-cream p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-peach text-lg font-extrabold">
          {group.name.slice(0, 1)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-lg font-bold tracking-tight">{group.name}</span>
          <span className="text-sm text-subtext">멤버 {members.length}명</span>
        </div>
        {needsCount > 0 && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-plum px-2.5 text-[13px] font-bold text-white">
            <span className="size-2 rounded-full bg-coral" aria-hidden="true" />
            응답 필요 {needsCount}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <div className="flex" aria-hidden="true">
          {shown.map((m, idx) => (
            <span
              key={m.id}
              className={`flex size-7 items-center justify-center rounded-full border-2 border-cream bg-white text-xs font-bold ${idx > 0 ? "-ml-1.5" : ""}`}
            >
              {m.name.slice(0, 1)}
            </span>
          ))}
          {rest > 0 && (
            <span className="-ml-1.5 flex size-7 items-center justify-center rounded-full border-2 border-cream bg-line text-xs font-bold">
              +{rest}
            </span>
          )}
        </div>

        {!featured && (
          <span className="text-sm text-faint">진행 중인 모임이 없어요</span>
        )}

        {featured && !confirmed && (
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            {featured.title}
            <span className="inline-flex h-6 items-center rounded-full bg-peach px-2.5 text-xs font-bold">
              투표 중
            </span>
          </span>
        )}

        {featured && confirmed && (
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            {formatDate(confirmed.date)} {featured.title}
            <span className="inline-flex h-6 items-center rounded-full bg-plum px-2.5 text-xs font-bold text-white">
              확정
            </span>
          </span>
        )}
      </div>
    </Link>
  );
}
