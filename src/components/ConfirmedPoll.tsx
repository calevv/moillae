import { Link } from "react-router";
import ResponseStatus from "@/components/ResponseStatus";
import { useGroup, useGroupMembers } from "@/stores/selectors";
import type { Poll } from "@/types/poll";
import { formatDate, formatDateLong, formatTime } from "@/utils/date";
import { countYes } from "@/utils/poll";

export default function ConfirmedPoll({ poll }: { poll: Poll }) {
  const group = useGroup(poll.groupId);
  const members = useGroupMembers(poll.groupId);

  const confirmed = poll.options.find((o) => o.id === poll.confirmedOptionId);
  if (!confirmed) return null;

  const others = poll.options.filter((o) => o.id !== confirmed.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-5 bg-white px-5 pt-3 pb-10 text-plum">
      {/* 상단 */}
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
        <span className="inline-flex h-7 items-center gap-1 rounded-full bg-plum pr-3 pl-2.5 text-[13px] font-bold text-white">
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
          확정 완료
        </span>
      </div>

      {/* 제목 */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
          {poll.title}
        </h1>
        <p className="text-[15px] text-subtext">
          {group?.name} · 투표가 마감되었어요
        </p>
      </div>

      {/* 확정된 시간 */}
      <section className="flex flex-col gap-3.5 rounded-[28px] bg-coral px-5 py-[22px]">
        <span className="inline-flex items-center gap-1.5 text-sm font-bold">
          <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-plum">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
              aria-hidden="true"
            >
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          확정된 시간
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[32px] leading-tight font-extrabold tracking-tight">
            {formatDateLong(confirmed.date)}
          </span>
          <span className="text-2xl font-bold tracking-tight">
            {formatTime(confirmed.time)}
          </span>
        </div>
        <span className="text-[15px] font-bold">
          {countYes(confirmed, members)}/{members.length}명 참석 가능
        </span>
      </section>

      {/* 멤버별 응답 */}
      <section className="flex flex-col gap-2.5">
        <h2 className="text-lg font-extrabold tracking-tight">멤버별 응답</h2>
        <ul className="flex flex-col divide-y divide-line rounded-3xl bg-cream px-4 py-1">
          {members.map((m) => (
            <li key={m.id} className="flex h-[60px] items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-white text-[15px] font-bold">
                {m.name.slice(0, 1)}
              </span>
              <span className="flex-1 text-base font-medium">{m.name}</span>
              <ResponseStatus status={confirmed.responses[m.id] ?? "pending"} />
            </li>
          ))}
        </ul>
      </section>

      {/* 다른 후보 */}
      {others.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-lg font-extrabold tracking-tight">다른 후보</h2>
          {others.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between gap-2 rounded-[20px] border-[1.5px] border-line px-4 py-3.5 text-subtext"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[15px] font-bold">
                  <span className={o.holiday ? "text-holiday-date" : ""}>
                    {formatDate(o.date)}
                  </span>{" "}
                  {formatTime(o.time)}
                </span>
                <span className="flex items-center gap-1.5 text-[13px]">
                  {countYes(o, members)}/{members.length}명 가능
                  {o.holiday && (
                    <span className="inline-flex h-[22px] items-center rounded-full bg-holiday-bg px-2 text-xs font-bold text-holiday-text">
                      공휴일 · {o.holiday}
                    </span>
                  )}
                </span>
              </div>
              <span className="text-[13px] font-bold">마감</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
