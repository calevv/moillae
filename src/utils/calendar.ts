import type { Group, Poll } from "@/types/poll";

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export type CalendarCell = { date: string; day: number; inMonth: boolean };

export type CalendarEvent = {
  key: string;
  pollId: string;
  groupId: string;
  title: string;
  groupName: string;
  date: string;
  time: string;
  status: "confirmed" | "candidate";
};

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayKey(): string {
  const t = new Date();
  return toDateKey(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

export function getMonthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay();
  const lastDay = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + lastDay) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(year, month - 1, 1 - firstWeekday + i);
    return {
      date: toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1,
    };
  });
}

export function buildEvents(
  polls: Poll[],
  groups: Group[],
): Record<string, CalendarEvent[]> {
  const groupNames = Object.fromEntries(groups.map((g) => [g.id, g.name]));
  const map: Record<string, CalendarEvent[]> = {};

  for (const poll of polls) {
    const status: CalendarEvent["status"] = poll.confirmedOptionId
      ? "confirmed"
      : "candidate";
    const options = poll.confirmedOptionId
      ? poll.options.filter((o) => o.id === poll.confirmedOptionId)
      : poll.options;

    for (const o of options) {
      (map[o.date] ??= []).push({
        key: `${poll.id}-${o.id}`,
        pollId: poll.id,
        groupId: poll.groupId,
        title: poll.title,
        groupName: groupNames[poll.groupId] ?? "",
        date: o.date,
        time: o.time,
        status,
      });
    }
  }

  for (const list of Object.values(map)) {
    list.sort((a, b) => a.time.localeCompare(b.time));
  }
  return map;
}

// 오늘(from)부터 확정된 모임만, 날짜 → 시간 순으로 limit개
export function getUpcomingEvents(
  events: Record<string, CalendarEvent[]>,
  from: string,
  limit = 5,
): CalendarEvent[] {
  return Object.keys(events)
    .filter((date) => date >= from) // "2026-12-05" 모양이라 글자 비교 = 날짜 비교
    .sort()
    .flatMap((date) => events[date].filter((e) => e.status === "confirmed"))
    .slice(0, limit);
}

// "오늘", "내일", 그 밖에는 "12.19 (금)"
export function formatUpcomingDay(date: string, today: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const base = new Date(ty, tm - 1, td);
  const diffDays = Math.round((target.getTime() - base.getTime()) / 86_400_000);

  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "내일";
  return `${m}.${d} (${WEEKDAYS[target.getDay()]})`;
}
