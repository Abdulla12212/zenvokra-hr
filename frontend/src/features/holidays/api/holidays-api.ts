import { api } from '@/lib/api-client';

export interface ClosedDay {
  date: string;
  name: string;
  detail: string;
}

export interface HolidayCalendar {
  todayIso: string;
  holidays: ClosedDay[];
}

export function listHolidays(signal?: AbortSignal): Promise<HolidayCalendar> {
  return api.get<HolidayCalendar>('/api/holidays', { signal });
}
