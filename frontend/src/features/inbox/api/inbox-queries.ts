import { useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/lib/api-client';
import { employeeAppKeys } from '@/lib/employee-query-keys';

import { listInbox, type InboxItem } from './inbox-api';

export const inboxKeys = {
  all: [...employeeAppKeys.all, 'inbox'] as const,
  list: () => [...inboxKeys.all, 'list'] as const,
};

export function useInbox() {
  return useQuery<InboxItem[], ApiError>({
    queryKey: inboxKeys.list(),
    queryFn: ({ signal }) => listInbox(signal),
  });
}
