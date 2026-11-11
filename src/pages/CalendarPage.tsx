import { useState } from "react";
import { Link } from "react-router";
import BottomNav from "@/components/BottomNav";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGroups, usePolls } from "@/stores/selectors";
import { buildEvents, getMonthCells, todayKey } from "@/utils/calendar";
import { formatDateLong, formatTime } from "@/utils/date";
import { getHoliday } from "@/utils/holiday";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function CalendarPage() {
  const currentUserId = useCurrentUser();
  const groups = useGroups();
  const polls = usePolls();

  const today = todayKey();
  const [view, setView] = useState(() => {
    const [year, month] = today.split("-").map(Number);
    return { year, month };
  });
  const [selected, setSelected] = useState(today);

  // 내 그룹의 투표만 일정으로
  const myGroups = groups.filter((g) => g.memberIds.includes(currentUserId));
  const myGroupIds = new Set(myGroups.map((g) => g.id));
  const events = buildEvents(
    polls.filter((p) => myGroupIds.has(p.groupId)),
    myGroups,
  );

  const cells = getMonthCells(view.year, view.month);
  const selectedEvents = events[selected] ?? [];
  const selectedHoliday = getHoliday(selected);

  function moveMonth(diff: number) {
    const d = new Date(view.year, view.month - 1 + diff, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-white text-plum">
      <div className="flex flex-1 flex-col gap-3.5 px-5 pt-5">
        {/* 월 이동 */}
        <div className="flex h-11 items-center justify-between">
          <h1 className="text-[28px] font-extrabold tracking-tight">
            {view.year}년 {view.month}월
          </h1>
          <div className="-mr-2.5 flex gap-1">
            <button
              type="button"
              aria-label="이전 달"
              onClick={() => moveMonth(-1)}
              className="flex size-11 items-center justify-center"
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
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="다음 달"
              onClick={() => moveMonth(1)}
              className="flex size-11 items-center justify-center"
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
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 요일 */}
        <div
          className="grid grid-cols-7 border-b border-line pb-2"
          aria-hidden="true"
        >
          {WEEKDAYS.map((w) => (
            <span
              key={w}
              className="text-center text-[13px] font-bold text-subtext"
            >
              {w}
            </span>
          ))}
        </div>

        {/* 날짜 칸 */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((cell) => {
            if (!cell.inMonth) {
              return (
                <div
                  key={cell.date}
                  aria-hidden="true"
                  className="flex h-[54px] items-center justify-center text-[15px] font-medium text-muted-line"
                >
                  {cell.day}
                </div>
              );
            }

            const dayEvents = events[cell.date] ?? [];
            const hasConfirmed = dayEvents.some(
              (e) => e.status === "confirmed",
            );
            const hasCandidate = !hasConfirmed && dayEvents.length > 0;
            const holiday = getHoliday(cell.date);
            const isSelected = cell.date === selected;

            const label =
              formatDateLong(cell.date) +
              (holiday ? ", 공휴일" : "") +
              (hasConfirmed
                ? ", 확정된 모임 있음"
                : hasCandidate
                  ? ", 투표 중인 후보 있음"
                  : "");

            return (
              <button
                key={cell.date}
                type="button"
                aria-label={label}
                aria-pressed={isSelected}
                onClick={() => setSelected(cell.date)}
                className="flex h-[54px] flex-col items-center justify-center gap-0.5"
              >
                <span
                  className={`flex size-[38px] items-center justify-center rounded-full text-base ${
                    isSelected
                      ? "bg-coral font-extrabold"
                      : holiday
                        ? "font-extrabold text-holiday-date"
                        : "font-medium"
                  }`}
                >
                  {cell.day}
                </span>
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    hasConfirmed
                      ? "bg-plum"
                      : hasCandidate
                        ? "border-[1.5px] border-plum"
                        : ""
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-4 text-[13px] text-subtext">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-plum" aria-hidden="true" />
            확정
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full border-[1.5px] border-plum"
              aria-hidden="true"
            />
            투표 중 후보
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="font-extrabold text-holiday-date"
              aria-hidden="true"
            >
              25
            </span>
            공휴일
          </span>
        </div>

        {/* 선택한 날의 일정 */}
        <section className="mt-1 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-lg font-extrabold tracking-tight">
              {formatDateLong(selected)}
            </h2>
            {selectedHoliday && (
              <span className="text-sm font-bold text-holiday-text">
                공휴일 · {selectedHoliday}
              </span>
            )}
          </div>

          {selectedEvents.length === 0 ? (
            <p className="rounded-[20px] bg-cream px-4 py-[18px] text-center text-[15px] text-subtext">
              이 날은 잡힌 모임이 없어요.
            </p>
          ) : (
            selectedEvents.map((e) => (
              <Link
                key={e.key}
                to={`/groups/${e.groupId}/polls/${e.pollId}`}
                className="flex items-center gap-3.5 rounded-[20px] bg-cream px-4 py-3.5"
              >
                <span className="w-16 shrink-0 text-sm font-bold text-subtext">
                  {formatTime(e.time)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[17px] font-bold">
                    {e.title}
                  </span>
                  <span className="truncate text-[13px] text-subtext">
                    {e.groupName}
                  </span>
                </div>
                {e.status === "confirmed" ? (
                  <span className="inline-flex h-[26px] shrink-0 items-center gap-1 rounded-full bg-plum pr-2.5 pl-2 text-xs font-bold text-white">
                    <svg
                      width="11"
                      height="11"
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
                ) : (
                  <span className="inline-flex h-[26px] shrink-0 items-center rounded-full bg-peach px-2.5 text-xs font-bold">
                    투표 중 후보
                  </span>
                )}
              </Link>
            ))
          )}
        </section>
      </div>

      <div className="sticky bottom-0 mt-4 bg-white px-5 pt-2 shadow-[0_-8px_20px_rgba(54,23,43,0.05)]">
        <BottomNav />
      </div>
    </div>
  );
}

export default CalendarPage;
