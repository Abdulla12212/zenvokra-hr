import { api } from '@/lib/api-client';
import type { InboxItem } from '@/lib/employee-app-types';

export type { InboxItem };

export function listInbox(signal?: AbortSignal): Promise<InboxItem[]> {
  return api.get<InboxItem[]>('/api/inbox', { signal });
}
