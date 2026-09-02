import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { ApprovalsTable } from '../components/approvals-table';
import { PageHeader } from '../components/page-header';
import { matchesApprovalFilter, type ApprovalFilter } from '../lib/approval-kind';
import { useAdminState } from '../use-admin-state';

const filters: { id: ApprovalFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'leave', label: 'Leave' },
  { id: 'clock', label: 'Clock in & out' },
  { id: 'late', label: 'Late arrival' },
];

export function AdminApprovalsPage() {
  const { approvals } = useAdminState();
  const [filter, setFilter] = useState<ApprovalFilter>('all');
  const [query, setQuery] = useState('');

  const counts = {
    leave: approvals.filter((item) => matchesApprovalFilter(item.kind, 'leave')).length,
    clock: approvals.filter((item) => matchesApprovalFilter(item.kind, 'clock')).length,
    late: approvals.filter((item) => matchesApprovalFilter(item.kind, 'late')).length,
  };
  const otherCount = approvals.filter(
    (item) =>
      !matchesApprovalFilter(item.kind, 'leave') &&
      !matchesApprovalFilter(item.kind, 'clock') &&
      !matchesApprovalFilter(item.kind, 'late'),
  ).length;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return approvals.filter((item) => {
      if (!matchesApprovalFilter(item.kind, filter)) {
        return false;
      }

      if (needle.length === 0) {
        return true;
      }

      return `${item.employeeName} ${item.details} ${item.department}`.toLowerCase().includes(needle);
    });
  }, [approvals, filter, query]);

  const oldest = approvals.at(-1)?.submittedLabel.split(' ')[0];

  return (
    <div>
      <PageHeader
        title="Approvals"
        description={
          approvals.length === 0
            ? 'Queue is clear'
            : `${approvals.length} pending${oldest ? ` · oldest ${oldest}` : ''}`
        }
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              toast.message('Export will be available when reports ship.');
            }}
          >
            <Download aria-hidden="true" />
            Export
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap gap-3">
        <SummaryChip label="Leave" value={counts.leave} />
        <SummaryChip label="Clock" value={counts.clock} />
        <SummaryChip label="Late" value={counts.late} />
        <SummaryChip label="Other" value={otherCount} />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((item) => {
              const count =
                item.id === 'all'
                  ? approvals.length
                  : item.id === 'leave'
                    ? counts.leave
                    : item.id === 'clock'
                      ? counts.clock
                      : counts.late;

              return (
                <Button
                  key={item.id}
                  type="button"
                  size="sm"
                  variant={filter === item.id ? 'default' : 'outline'}
                  className="h-8"
                  aria-pressed={filter === item.id}
                  onClick={() => {
                    setFilter(item.id);
                  }}
                >
                  {item.label} {count}
                </Button>
              );
            })}
          </div>
          <label className="relative">
            <span className="sr-only">Search approvals</span>
            <Input
              className="h-8 w-52"
              placeholder="Search approvals"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
          </label>
        </div>
        <ApprovalsTable approvals={visible} />
      </div>
    </div>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn('bg-card min-w-16 rounded-lg border px-3 py-2 text-center')}>
      <p className="text-muted-foreground text-[11px]">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
