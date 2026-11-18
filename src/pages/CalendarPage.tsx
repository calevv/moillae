import { useState } from "react";
import { useSearchParams } from "react-router";
import { DayEventRow, UpcomingEventRow } from "@/components/CalendarEventRow";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGroups, usePolls } from "@/stores/selectors";
import {
  WEEKDAYS,
  buildEvents,
  formatUpcomingDay,
  getMonthCells,
  getUpcomingEvents,
  todayKey,
} from "@/utils/calendar";
import { formatDateLong } from "@/utils/date";
import { getHoliday } from "@/utils/holiday";

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

// 보이는 칩은 36px, 누르는 영역은 바깥 버튼 44px
function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="flex h-11 shrink-0 items-center px-1"
    >
      <span
        className={`block h-9 max-w-[168px] truncate rounded-full border px-3.5 text-sm leading-[34px] ${
          active
            ? "border-plum bg-plum font-bold text-white"
            : "border-line bg-white font-medium"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function CalendarPage() {
  const currentUserId = useCurrentUser();
  const groups = useGroups();
  const polls = usePolls();
  const [searchParams, setSearchParams] = useSearchParams();

  const today = todayKey();
  const [view, setView] = useState(() => {
    const [year, month] = today.split("-").map(Number);
    return { year, month };
  });
  const [selected, setSelected] = useState(today);

  const myGroups = groups.filter((g) => g.memberIds.includes(currentUserId));

  // URL의 ?group= 값. 내 그룹에 없는 id(나간 그룹 등)면 "전체"로
  const groupParam = searchParams.get("group");
  const activeGroupId = myGroups.some((g) => g.id === groupParam)
    ? groupParam
    : null;

  const visibleGroups = activeGroupId
    ? myGroups.filter((g) => g.id === activeGroupId)
    : myGroups;
  const visibleGroupIds = new Set(visibleGroups.map((g) => g.id));
  const events = buildEvents(
    polls.filter((p) => visibleGroupIds.has(p.groupId)),
    visibleGroups,
  );
  const upcoming = getUpcomingEvents(events, today);

  const cells = getMonthCells(view.year, view.month);
  const selectedEvents = events[selected] ?? [];
  const selectedHoliday = getHoliday(selected);

  function moveMonth(diff: number) {
    const d = new Date(view.year, view.month - 1 + diff, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  function selectGroup(groupId: string | null) {
    // replace: 칩을 누를 때마다 방문 기록이 쌓이지 않게
    setSearchParams(groupId ? { group: groupId } : {}, { replace: true });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-5">
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

        {/* 그룹 필터: 그룹이 2개 이상일 때만 */}
        {myGroups.length > 1 && (
          <div
            role="group"
            aria-label="그룹별로 보기"
            className="-mx-5 mt-2 flex overflow-x-auto px-4"
          >
            <FilterChip
              label="전체"
              active={activeGroupId === null}
              onClick={() => selectGroup(null)}
            />
            {myGroups.map((g) => (
              <FilterChip
                key={g.id}
                label={g.name}
                active={activeGroupId === g.id}
                onClick={() => selectGroup(g.id)}
              />
            ))}
          </div>
        )}

        {/* 요일 */}
        <div
          className="mt-1 grid h-7 grid-cols-7 items-center"
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

        {/* 날짜 칸: 줄마다 위 구분선, 맨 아래 구분선 */}
        <div className="border-b border-line">
          <div className="grid grid-cols-7">
            {cells.map((cell) => {
              if (!cell.inMonth) {
                return <span key={cell.date} aria-hidden="true" />;
              }

              const dayEvents = events[cell.date] ?? [];
              const hasConfirmed = dayEvents.some(
                (e) => e.status === "confirmed",
              );
              const hasCandidate = dayEvents.some(
                (e) => e.status === "candidate",
              );
              const holiday = getHoliday(cell.date);
              const isSelected = cell.date === selected;
              const isToday = cell.date === today;

              const label =
                formatDateLong(cell.date) +
                (isToday ? ", 오늘" : "") +
                (holiday ? ", 공휴일" : "") +
                (hasConfirmed ? ", 확정된 모임 있음" : "") +
                (hasCandidate ? ", 투표 중인 후보 있음" : "");

              return (
                <button
                  key={cell.date}
                  type="button"
                  aria-label={label}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(cell.date)}
                  className="flex h-[54px] flex-col items-center border-t border-line"
                >
                  <span
                    className={`mt-[3px] flex size-8 items-center justify-center rounded-full text-[15px] ${
                      isSelected
                        ? "bg-coral font-bold"
                        : holiday
                          ? "font-bold text-holiday-date"
                          : "font-medium"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {/* 점 줄. 나중에 내 일정 막대는 이 아래 줄에 들어가요 */}
                  <span
                    aria-hidden="true"
                    className="mt-1 flex h-1.5 gap-[3px]"
                  >
                    {hasConfirmed && (
                      <span className="size-1.5 rounded-full bg-plum" />
                    )}
                    {hasCandidate && (
                      <span className="size-1.5 rounded-full border-[1.5px] border-plum" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 범례 */}
        <div className="flex h-11 items-center gap-3.5 text-[13px] text-subtext">
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
            <span className="font-bold text-holiday-date" aria-hidden="true">
              25
            </span>
            공휴일
          </span>
        </div>
      </div>

      {/* 선택한 날의 일정 */}
      <section aria-labelledby="selected-title" className="px-5 py-4">
        <div className="flex min-h-7 flex-wrap items-baseline gap-x-2">
          <h2
            id="selected-title"
            className="text-[17px] font-bold tracking-tight"
          >
            {formatDateLong(selected)}
          </h2>
          {selected === today && (
            <span className="text-[13px] text-subtext">오늘</span>
          )}
          {selectedHoliday && (
            <span className="text-[13px] font-bold text-holiday-text">
              공휴일 · {selectedHoliday}
            </span>
          )}
        </div>

        {selectedEvents.length === 0 ? (
          <p className="border-t border-line pt-4 pb-1 text-[15px] text-subtext">
            이 날은 잡힌 모임이 없어요.
          </p>
        ) : (
          <ul>
            {selectedEvents.map((e) => (
              <li key={e.key}>
                <DayEventRow event={e} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 두 목록 사이 띠 */}
      <div aria-hidden="true" className="h-2 bg-cream" />

      {/* 다가오는 모임: 오늘부터 확정된 것만 5개 */}
      <section aria-labelledby="upcoming-title" className="px-5 pt-4 pb-6">
        <div className="flex h-7 items-baseline justify-between">
          <h2
            id="upcoming-title"
            className="text-[17px] font-bold tracking-tight"
          >
            다가오는 모임
          </h2>
          <span className="text-[13px] text-subtext">확정된 모임만</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="border-t border-line pt-4 pb-1">
            <p className="text-[15px] text-subtext">확정된 모임이 없어요.</p>
            <p className="mt-1 text-[13px] text-subtext">
              투표가 끝나면 여기에 보여요.
            </p>
          </div>
        ) : (
          <ul>
            {upcoming.map((e) => (
              <li key={e.key}>
                <UpcomingEventRow
                  event={e}
                  dayLabel={formatUpcomingDay(e.date, today)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default CalendarPage;
