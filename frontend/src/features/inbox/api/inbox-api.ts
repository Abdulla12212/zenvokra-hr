import { api } from '@/lib/api-client';

export type InboxKind = 'leave' | 'punch' | 'in' | 'holiday';

export interface InboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  detail: string;
  badgeLabel: string;
  badgeVariant: 'late' | 'present' | 'default';
  actionLabel?: string | null;
  actionTo?: string | null;
  unread: boolean;
}

export function listInbox(signal?: AbortSignal): Promise<InboxItem[]> {
  return api.get<InboxItem[]>('/api/inbox', { signal });
}
