import { Link, useParams } from "react-router";
import PollSummaryCard from "@/components/PollSummaryCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGroup, useGroupMembers, useGroupPolls } from "@/stores/selectors";
import CopyInviteButton from "@/components/CopyInviteButton";

function GroupPage() {
  const { groupId } = useParams();
  const currentUserId = useCurrentUser();
  const group = useGroup(groupId);
  const groupMembers = useGroupMembers(groupId);
  const groupPolls = useGroupPolls(groupId);

  if (!group) {
    return <p className="p-5 text-plum">그룹을 찾을 수 없어요.</p>;
  }
  const isAlone = groupMembers.length <= 1; // 나 혼자인 그룹
  const hasPolls = groupPolls.length > 0;
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-[22px] px-5 pt-3">
        <Link
          to="/home"
          aria-label="뒤로 가기"
          className="-ml-2.5 flex size-11 items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
            {group.name}
          </h1>
          <p className="text-[15px] text-subtext">
            멤버 {groupMembers.length}명
          </p>
        </div>

        {/* 멤버 */}
        {isAlone ? (
          <section className="flex flex-col gap-3.5 rounded-3xl bg-peach px-4 py-[18px]">
            <div className="flex items-center gap-3">
              <div className="flex shrink-0">
                <span className="flex size-11 items-center justify-center rounded-full border-2 border-peach bg-white font-bold">
                  나
                </span>
                <span
                  className="-ml-2 flex size-11 items-center justify-center rounded-full border-2 border-dashed border-faint bg-peach"
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[17px] font-extrabold tracking-tight">
                  친구를 초대해 보세요
                </span>
                <span className="text-sm text-subtext">
                  링크를 보내면 바로 참여할 수 있어요.
                </span>
              </div>
            </div>
            <CopyInviteButton
              groupId={group.id}
              inviteCode={group.inviteCode}
              variant="dark"
            />
          </section>
        ) : (
          <section className="flex flex-col gap-3.5">
            <ul className="flex flex-wrap gap-2.5">
              {groupMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex w-12 flex-col items-center gap-1.5"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-cream text-[17px] font-bold">
                    {m.name.slice(0, 1)}
                  </span>
                  <span className="w-full truncate text-center text-[13px] font-medium">
                    {m.name}
                  </span>
                </li>
              ))}
            </ul>
            <CopyInviteButton
              groupId={group.id}
              inviteCode={group.inviteCode}
            />
          </section>
        )}

        {/* 모임 제안 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">모임 제안</h2>
          {hasPolls ? (
            groupPolls.map((poll) => (
              <PollSummaryCard
                key={poll.id}
                poll={poll}
                members={groupMembers}
                currentUserId={currentUserId}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border-[1.5px] border-dashed border-muted-line p-6 text-center">
              <span
                className="flex size-14 items-center justify-center rounded-full bg-cream"
                aria-hidden="true"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="5.5" width="16" height="14" rx="3" />
                  <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
                </svg>
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                아직 모임 제안이 없어요
              </span>
              <span className="text-sm leading-relaxed text-subtext">
                후보 시간을 여러 개 올리면
                <br />
                친구들이 가능한 시간에 투표해요.
              </span>
            </div>
          )}
        </section>
      </div>

      {/* 하단 고정 버튼 (탭 바로 위) */}
      <div className="sticky bottom-tab-bar mt-4 bg-white px-5 py-3 shadow-[0_-8px_20px_rgba(54,23,43,0.05)]">
        <Link
          to={`/groups/${group.id}/polls/new`}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-coral text-[17px] font-bold"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {hasPolls ? "새 모임 제안" : "첫 모임 제안하기"}
        </Link>
      </div>
    </div>
  );
}

export default GroupPage;
