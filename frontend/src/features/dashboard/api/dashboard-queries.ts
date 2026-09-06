import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';

import { getDashboard, type Dashboard } from './dashboard-api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  current: () => [...dashboardKeys.all, 'current'] as const,
};

export function useDashboard() {
  return useQuery<Dashboard, ApiError>({
    queryKey: dashboardKeys.current(),
    queryFn: ({ signal }) => getDashboard(signal),
  });
}
