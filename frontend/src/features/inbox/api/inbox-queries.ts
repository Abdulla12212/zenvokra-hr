import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeTimeKeys } from '@/lib/employee-time-keys';

import { listInbox, type InboxItem } from './inbox-api';

export const inboxKeys = {
  all: [...employeeTimeKeys.all, 'inbox'] as const,
  list: () => [...inboxKeys.all, 'list'] as const,
};

export function useInbox() {
  return useQuery<InboxItem[], ApiError>({
    queryKey: inboxKeys.list(),
    queryFn: ({ signal }) => listInbox(signal),
  });
}
