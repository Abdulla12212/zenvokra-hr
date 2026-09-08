import { cn } from '@/lib/utils';
import type { ApprovalItem } from '../api/approvals-api';

import { drawerTypeLabel, requestTypeLabel, requestTypeTone } from './approval-format';

export function ApprovalTypeBadge({
  item,
  drawer = false,
}: {
  item: ApprovalItem;
  drawer?: boolean;
}) {
  const tone = requestTypeTone(item);

  return (
    <span
      className={cn(
        'text-label-xs inline-flex w-fit items-center px-2.5 py-1 font-semibold',
        drawer ? 'rounded-md tracking-wide uppercase' : 'rounded-full',
        tone === 'punch' && 'bg-secondary-fixed text-on-secondary-fixed',
        tone === 'sick' && 'bg-destructive-muted text-destructive',
        tone === 'leave' && 'bg-primary-fixed text-primary-deep',
      )}
    >
      {drawer ? drawerTypeLabel(item) : requestTypeLabel(item)}
    </span>
  );
}
