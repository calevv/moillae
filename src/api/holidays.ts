import { supabase } from '@/lib/supabase';

export type Holiday = { date: string; name: string };

type HolidaysResponse = { year: number; holidays: Holiday[] };

// Edge Function(moillae-holidays)에 연도를 보내고 그해 공휴일 목록을 받아요
export async function fetchHolidays(year: number): Promise<Holiday[]> {
    const { data, error } = await supabase.functions.invoke<HolidaysResponse>('moillae-holidays', { body: { year } });
    if (error) throw error;
    return data?.holidays ?? [];
}
