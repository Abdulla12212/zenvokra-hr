import { useQuery } from '@tanstack/react-query';

import { adminOpsKeys } from '@/lib/admin-ops-keys';
import type { ApiError } from '@/lib/api-client';

import { getDashboard, type Dashboard } from './dashboard-api';

export const dashboardKeys = {
  all: [...adminOpsKeys.all, 'dashboard'] as const,
};

export function useDashboard() {
  return useQuery<Dashboard, ApiError>({
    queryKey: dashboardKeys.all,
    queryFn: ({ signal }) => getDashboard(signal),
  });
}
