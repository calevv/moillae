import { create } from 'zustand';
import { fetchHolidays } from '@/api/holidays';
import type { YearStatus } from '@/utils/holiday';

type HolidayState = {
    byDate: Record<string, string>; // 받아 온 공휴일 전부 { "2026-12-25": "기독탄신일" }
    years: Record<number, YearStatus>; // 연도별로 받았는지
    loadYear: (year: number) => Promise<void>;
};

export const useHolidayStore = create<HolidayState>()((set, get) => ({
    byDate: {},
    years: {},

    loadYear: async (year) => {
        // 이미 받았거나 받는 중이면 다시 부르지 않기 (실패한 연도는 다음에 다시 시도)
        const status = get().years[year];
        if (status === 'loading' || status === 'ready') return;

        set((s) => ({ years: { ...s.years, [year]: 'loading' } }));
        try {
            const holidays = await fetchHolidays(year);
            set((s) => ({
                byDate: {
                    ...s.byDate,
                    ...Object.fromEntries(holidays.map((h) => [h.date, h.name])),
                },
                years: { ...s.years, [year]: 'ready' },
            }));
        } catch (e) {
            console.error('공휴일을 불러오지 못했어요', e);
            set((s) => ({ years: { ...s.years, [year]: 'error' } }));
        }
    },
}));
