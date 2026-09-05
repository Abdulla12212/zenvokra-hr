import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';

import { getCurrentEmployee, type Employee } from './employees-api';

export const employeeKeys = {
  all: ['employees'] as const,
  current: () => [...employeeKeys.all, 'current'] as const,
};

export function useCurrentEmployee() {
  return useQuery<Employee, ApiError>({
    queryKey: employeeKeys.current(),
    queryFn: ({ signal }) => getCurrentEmployee(signal),
  });
}
