import { useState } from "react";
import { Link, useParams } from "react-router";
import CandidateCard from "@/components/CandidateCard";
import { CURRENT_USER_ID, groups, members, polls } from "@/data/dummy";
import type { Poll } from "@/types/poll";
import { countYes } from "@/utils/poll";

function PollPage() {
  const { pollId } = useParams();
  const poll = polls.find((p) => p.id === pollId);

  if (!poll) {
    return <p className="p-5 text-plum">투표를 찾을 수 없어요.</p>;
  }

  return <PollView key={poll.id} poll={poll} />;
}

function PollView({ poll }: { poll: Poll }) {
  const [options, setOptions] = useState(poll.options);

  function handleRespond(optionId: string, value: "yes" | "no") {
    setOptions((prev) =>
      prev.map((o) => {
        if (o.id !== optionId) return o;
        const current = o.responses[CURRENT_USER_ID] ?? "pending";
        const next = current === value ? "pending" : value;
        return { ...o, responses: { ...o.responses, [CURRENT_USER_ID]: next } };
      }),
    );
  }

  const group = groups.find((g) => g.id === poll.groupId);
  // 이 투표가 속한 그룹의 멤버만
  const pollMembers = members.filter((m) => group?.memberIds.includes(m.id));

  const isHost = poll.hostId === CURRENT_USER_ID;
  const maxYes = Math.max(...options.map((o) => countYes(o, pollMembers)));
  const notResponded = pollMembers.filter((m) =>
    options.every((o) => (o.responses[m.id] ?? "pending") === "pending"),
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-5 bg-white px-5 pt-3 pb-10 text-plum">
      <div className="flex items-center justify-between">
        <Link
          to={`/groups/${poll.groupId}`}
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
        {isHost && (
          <span className="inline-flex h-7 items-center rounded-full bg-cream px-3 text-[13px] font-bold text-subtext">
            내가 만든 모임
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
          {poll.title}
        </h1>
        <p className="text-[15px] text-subtext">
          {group?.name} · 후보 {options.length}개 · 멤버 {pollMembers.length}명
        </p>
      </div>

      {notResponded.length > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-cream px-3.5 py-3 text-sm text-subtext">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </svg>
          <span>
            아직 응답하지 않은 멤버가 있어요 ·{" "}
            <b className="text-plum">
              {notResponded.map((m) => m.name).join(", ")}
            </b>
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {options.map((option) => (
          <CandidateCard
            key={option.id}
            option={option}
            members={pollMembers}
            currentUserId={CURRENT_USER_ID}
            isRecommended={
              maxYes > 0 && countYes(option, pollMembers) === maxYes
            }
            isHost={isHost}
            onRespond={(value) => handleRespond(option.id, value)}
          />
        ))}
      </div>

      {!isHost && (
        <p className="text-center text-sm text-faint">
          시간 확정은 모임을 만든 사람만 할 수 있어요.
        </p>
      )}
    </div>
  );
}

export default PollPage;
