import { Link } from "react-router";
import GroupCard from "@/components/GroupCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGroups, useMemberMap, usePolls } from "@/stores/selectors";
import { needsMyResponse } from "@/utils/poll";
import BottomNav from "@/components/BottomNav";

function HomePage() {
  const currentUserId = useCurrentUser();
  const groups = useGroups();
  const polls = usePolls();
  const memberMap = useMemberMap();

  // 내가 속한 그룹만
  const myGroups = groups.filter((g) => g.memberIds.includes(currentUserId));
  const myGroupIds = new Set(myGroups.map((g) => g.id));

  // 내 그룹의 투표 중 내 응답이 필요한 것
  const pendingPolls = polls.filter(
    (p) => myGroupIds.has(p.groupId) && needsMyResponse(p, currentUserId),
  );
  const firstPending = pendingPolls[0];

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-white text-plum">
      <div className="flex flex-1 flex-col gap-5 px-5 pt-5">
        <div className="flex h-11 items-center gap-2">
          <svg width="32" height="26" viewBox="0 0 40 32" aria-hidden="true">
            <circle cx="14" cy="16" r="13" className="fill-coral" />
            <circle
              cx="26"
              cy="16"
              r="13"
              className="fill-plum"
              fillOpacity="0.88"
            />
          </svg>
          <span className="text-xl font-extrabold tracking-tight">모일래</span>
        </div>

        <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
          내 그룹
        </h1>

        {myGroups.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-10">
            <div
              className="flex size-[200px] items-center justify-center rounded-full bg-peach"
              aria-hidden="true"
            >
              <svg width="120" height="96" viewBox="0 0 40 32">
                <circle cx="14" cy="16" r="13" className="fill-coral" />
                <circle
                  cx="26"
                  cy="16"
                  r="13"
                  className="fill-plum"
                  fillOpacity="0.88"
                />
              </svg>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-[22px] font-extrabold tracking-tight">
                아직 그룹이 없어요
              </h2>
              <p className="text-[15px] leading-relaxed text-subtext">
                그룹을 만들고 친구를 초대해 보세요.
                <br />
                초대 링크를 받았다면 링크를 눌러
                <br />
                바로 참여할 수 있어요.
              </p>
            </div>
            <Link
              to="/groups/new"
              className="flex h-[54px] items-center gap-2 rounded-full bg-coral px-8 text-[17px] font-bold"
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
              첫 그룹 만들기
            </Link>
          </div>
        ) : (
          <>
            {firstPending && (
              <Link
                to={`/groups/${firstPending.groupId}/polls/${firstPending.id}`}
                className="flex min-h-11 items-center gap-3 rounded-[20px] bg-peach px-4 py-3.5"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15zM10 21h4" />
                </svg>
                <span className="flex-1 text-[15px] font-bold">
                  응답이 필요한 모임이 {pendingPolls.length}개 있어요
                </span>
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
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}

            <div className="flex flex-col gap-3">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  members={group.memberIds
                    .map((id) => memberMap[id])
                    .filter(Boolean)}
                  polls={polls.filter((p) => p.groupId === group.id)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 mt-4 flex flex-col gap-3 bg-white px-5 pt-3 shadow-[0_-8px_20px_rgba(54,23,43,0.05)]">
        {myGroups.length > 0 && (
          <Link
            to="/groups/new"
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
            그룹 만들기
          </Link>
        )}
        <BottomNav />
      </div>
    </div>
  );
}

export default HomePage;
