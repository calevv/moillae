// 임시 공휴일 목록. 나중에 공공데이터 API(Edge Function)로 바꿀 예정.
const HOLIDAYS: Record<string, string> = {
  "2026-12-25": "기독탄신일",
  "2027-01-01": "신정",
};

export function getHoliday(date: string): string | undefined {
  return HOLIDAYS[date];
}
