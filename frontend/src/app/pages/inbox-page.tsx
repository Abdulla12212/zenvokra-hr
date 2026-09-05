import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/page-title';
import { Skeleton } from '@/components/ui/skeleton';
import { useInbox } from '@/features/inbox/api/inbox-queries';
import type { InboxItem } from '@/lib/employee-app-store';

export function InboxPage() {
  const inbox = useInbox();

  if (inbox.isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (inbox.isError) {
    return (
      <p role="alert" className="text-destructive p-6 text-sm">
        {inbox.error.message}
      </p>
    );
  }

  if (inbox.data.length === 0) {
    return (
      <div className="p-6">
        <PageTitle>Inbox</PageTitle>
        <p className="text-muted-foreground mt-6 text-sm">Nothing waiting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5">
        <PageTitle>Inbox</PageTitle>
      </div>
      <div className="bg-card rounded-xl border shadow-sm">
        {inbox.data.map((item) => (
          <InboxRow key={item.id} item={item} />
        ))}
      </div>
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
        <Button
          variant={item.kind === 'punch' ? 'outline' : 'ghost'}
          size="sm"
          asChild
        >
          <Link to={item.actionTo}>{item.actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
