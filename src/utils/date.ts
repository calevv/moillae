const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-12-19" → "12/19 (토)"
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  return `${month}/${day} (${weekday})`;
}

// "2026-12-19" → "12월 19일 (토)"
export function formatDateLong(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

// "19:00" → "오후 7:00"
export function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour < 12 ? "오전" : "오후";
  const hour12 = hour % 12 || 12;
  return `${period} ${hour12}:${String(minute).padStart(2, "0")}`;
}
