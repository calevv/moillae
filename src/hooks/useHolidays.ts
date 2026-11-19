import { useCallback, useEffect } from 'react';
import { useHolidayStore } from '@/stores/useHolidayStore';
import { resolveHoliday } from '@/utils/holiday';

// 필요한 연도의 공휴일을 불러오고, 날짜로 공휴일 이름을 찾는 함수를 돌려줘요
// 공휴일이 도착하면 스토어가 바뀌어서 이 훅을 쓰는 화면이 다시 그려져요
export function useHolidays(years: number[]) {
    const byDate = useHolidayStore((s) => s.byDate);
    const yearStatus = useHolidayStore((s) => s.years);
    const loadYear = useHolidayStore((s) => s.loadYear);

    // 배열은 그릴 때마다 새로 만들어져서, 글자로 바꿔야 "내용이 바뀔 때만" 다시 불러와요
    // 함수가 받는 범위(2000~2100)만 남겨서, 입력 중인 이상한 연도는 부르지 않기
    const yearsKey = [...new Set(years)]
        .filter((y) => y >= 2000 && y <= 2100)
        .sort()
        .join(',');

    useEffect(() => {
        if (!yearsKey) return;
        for (const y of yearsKey.split(',')) loadYear(Number(y));
    }, [yearsKey, loadYear]);

    return useCallback((date: string) => resolveHoliday(date, byDate, yearStatus), [byDate, yearStatus]);
}
