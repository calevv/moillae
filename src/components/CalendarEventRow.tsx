import { Link } from "react-router";
import type { CalendarEvent } from "@/utils/calendar";
import { formatTime } from "@/utils/date";

function pollPath(event: CalendarEvent) {
  return `/groups/${event.groupId}/polls/${event.pollId}`;
}

// 선택한 날 목록: 왼쪽 시간, 오른쪽 상태
export function DayEventRow({ event }: { event: CalendarEvent }) {
  const confirmed = event.status === "confirmed";

  return (
    <Link
      to={pollPath(event)}
      className="flex min-h-16 items-center gap-3 border-t border-line py-2.5"
    >
      <span className="w-[68px] shrink-0 text-sm font-bold text-subtext">
        {formatTime(event.time)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-bold">{event.title}</span>
        <span className="truncate text-[13px] text-subtext">
          {event.groupName}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-bold">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${
            confirmed ? "bg-plum" : "border-[1.5px] border-plum"
          }`}
        />
        {confirmed ? "확정" : "투표 중 후보"}
      </span>
    </Link>
  );
}

type UpcomingEventRowProps = {
  event: CalendarEvent;
  dayLabel: string; // "오늘", "내일", "12.19 (토)"
};

// 다가오는 모임 목록: 왼쪽 날짜, 아래 "시간 · 그룹", 오른쪽 화살표
export function UpcomingEventRow({ event, dayLabel }: UpcomingEventRowProps) {
  return (
    <Link
      to={pollPath(event)}
      className="flex min-h-[60px] items-center gap-3 border-t border-line py-2"
    >
      <span className="w-[72px] shrink-0 text-sm font-bold">{dayLabel}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-bold">{event.title}</span>
        <span className="truncate text-[13px] text-subtext">
          {formatTime(event.time)} · {event.groupName}
        </span>
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-subtext"
      >
        <path d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
