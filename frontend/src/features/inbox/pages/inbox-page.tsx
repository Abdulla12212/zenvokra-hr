import { Link } from 'react-router';

import { PageTitle } from '@/components/page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import type { InboxItem } from '../api/inbox-api';
import { useInbox } from '../api/inbox-queries';

export function InboxPage() {
  const inbox = useInbox();

  if (inbox.isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading inbox</span>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (inbox.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {inbox.error.message}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <PageTitle>Inbox</PageTitle>

      {inbox.data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">Nothing waiting.</p>
      ) : (
        <div className="bg-card rounded-xl border shadow-sm">
          {inbox.data.map((item) => (
            <InboxRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function InboxRow({ item }: { item: InboxItem }) {
  return (
    <div className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <Badge variant={item.badgeVariant}>{item.badgeLabel}</Badge>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.title}</p>
        <p className="text-muted-foreground text-xs">{item.detail}</p>
      </div>
      {item.actionLabel && item.actionTo ? (
        <Button variant={item.kind === 'punch' ? 'outline' : 'ghost'} size="sm" asChild>
          <Link to={item.actionTo}>{item.actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
