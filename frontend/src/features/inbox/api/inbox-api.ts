import { getInboxItems, type InboxItem } from '@/lib/employee-app-store';

export type { InboxItem };

export function listInbox(_signal?: AbortSignal): Promise<InboxItem[]> {
  return Promise.resolve(getInboxItems());
}
