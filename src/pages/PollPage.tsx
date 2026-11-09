import CandidateCard from "@/components/CandidateCard";
import { CURRENT_USER_ID, members, polls } from "@/data/dummy";
import { countYes } from "@/utils/poll";

function PollPage() {
  const poll = polls[0];
  const isHost = poll.hostId === CURRENT_USER_ID;

  // 가장 많은 가능 인원
  const maxYes = Math.max(...poll.options.map((o) => countYes(o, members)));

  return (
    <div className="mx-auto min-h-screen max-w-[390px] bg-white px-5 py-3 text-plum">
      <div className="flex flex-col gap-3.5">
        {poll.options.map((option) => (
          <CandidateCard
            key={option.id}
            option={option}
            members={members}
            currentUserId={CURRENT_USER_ID}
            isRecommended={maxYes > 0 && countYes(option, members) === maxYes}
            isHost={isHost}
          />
        ))}
      </div>
    </div>
  );
}

export default PollPage;
