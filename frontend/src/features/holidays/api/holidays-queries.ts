import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeTimeKeys } from '@/lib/employee-time-keys';

import { listHolidays, type HolidayCalendar } from './holidays-api';

export const holidayKeys = {
  all: [...employeeTimeKeys.all, 'holidays'] as const,
  list: () => [...holidayKeys.all, 'list'] as const,
};

export function useHolidays() {
  return useQuery<HolidayCalendar, ApiError>({
    queryKey: holidayKeys.list(),
    queryFn: ({ signal }) => listHolidays(signal),
  });
}
