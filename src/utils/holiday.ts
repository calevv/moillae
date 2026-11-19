// 날짜가 매년 같은 공휴일. 공휴일 API를 아직 못 받았거나 실패했을 때만 써요
// 음력(설날, 추석, 부처님오신날), 대체공휴일, 선거일 같은 그해 공휴일은 API로만 알 수 있어요
const FIXED_HOLIDAYS: Record<string, string> = {
    '01-01': '1월1일',
    '03-01': '삼일절',
    '05-05': '어린이날',
    '06-06': '현충일',
    '08-15': '광복절',
    '10-03': '개천절',
    '10-09': '한글날',
    '12-25': '기독탄신일',
};

export type YearStatus = 'loading' | 'ready' | 'error';

// 받아 둔 연도면 그 목록만 믿고, 아니면 매년 같은 날 목록으로
export function resolveHoliday(
    date: string, // "2026-12-25"
    byDate: Record<string, string>,
    years: Record<number, YearStatus>,
): string | undefined {
    const year = Number(date.slice(0, 4));
    if (years[year] === 'ready') return byDate[date];
    return FIXED_HOLIDAYS[date.slice(5)];
}
