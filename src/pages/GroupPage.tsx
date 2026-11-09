import { Link, useParams } from "react-router";
import PollSummaryCard from "@/components/PollSummaryCard";
import { CURRENT_USER_ID, groups, members, polls } from "@/data/dummy";

function GroupPage() {
  const { groupId } = useParams();
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return <p className="p-5 text-plum">그룹을 찾을 수 없어요.</p>;
  }

  const groupMembers = members.filter((m) => group.memberIds.includes(m.id));
  const groupPolls = polls.filter((p) => p.groupId === group.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-white text-plum">
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
                <span className="text-[13px] font-medium">{m.name}</span>
              </li>
            ))}
            <li className="flex w-12 flex-col items-center gap-1.5">
              <button
                type="button"
                aria-label="멤버 초대"
                className="flex size-12 items-center justify-center rounded-full border-[1.5px] border-dashed border-muted-line bg-white"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <span className="text-[13px] font-medium text-subtext">초대</span>
            </li>
          </ul>
          <button
            type="button"
            className="flex h-[50px] items-center justify-center gap-2 rounded-full border-[1.5px] border-plum bg-white text-base font-bold"
          >
            초대 링크 복사
          </button>
        </section>

        {/* 모임 제안 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">모임 제안</h2>
          {groupPolls.map((poll) => (
            <PollSummaryCard
              key={poll.id}
              poll={poll}
              members={groupMembers}
              currentUserId={CURRENT_USER_ID}
            />
          ))}
        </section>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="sticky bottom-0 mt-4 bg-white px-5 pt-3 pb-7 shadow-[0_-8px_20px_rgba(54,23,43,0.05)]">
        <button
          type="button"
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
          새 모임 제안
        </button>
      </div>
    </div>
  );
}

export default GroupPage;
