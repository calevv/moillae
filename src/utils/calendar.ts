import type { Group, Poll } from "@/types/poll";

export type CalendarCell = {
  date: string; // "2026-12-05"
  day: number; // 5
  inMonth: boolean; // 이번 달 날짜인지
};

export type CalendarEvent = {
  key: string;
  pollId: string;
  groupId: string;
  title: string;
  groupName: string;
  time: string;
  status: "confirmed" | "candidate";
};

// 2026, 12, 5 → "2026-12-05"
export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayKey(): string {
  const t = new Date();
  return toDateKey(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

// 한 달 달력의 칸들 (앞뒤 달 날짜 포함, 일요일부터 시작)
export function getMonthCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const firstWeekday = first.getDay(); // 1일의 요일 (일 0 ~ 토 6)
  const lastDay = new Date(year, month, 0).getDate(); // 이번 달 마지막 날
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

// 투표들 → { 날짜: 그날의 일정 목록 }
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
