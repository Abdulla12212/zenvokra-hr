import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useTenants } from '../api/tenants-queries';
import { CompanyFormDialog } from '../components/company-form-dialog';
import { CompanyTable } from '../components/company-table';

export function CompaniesPage() {
  const { data, isPending, isError, error } = useTenants();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="text-muted-foreground text-sm">
            Onboard a company, then add the tenant admins who will run it.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add company
        </Button>
      </header>

      <CompanyFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {isPending ? <LoadingState /> : null}

      {isError ? (
        <p role="alert" className="text-destructive text-sm">
          {error.message}
        </p>
      ) : null}

      {data ? (
        data.items.length > 0 ? (
          <div className="space-y-3">
            <CompanyTable tenants={data.items} />
            <p className="text-muted-foreground text-xs">
              {data.totalCount} compan{data.totalCount === 1 ? 'y' : 'ies'}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No companies yet. Add the first one to start onboarding.
          </p>
        )
      ) : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading companies</span>
      {[0, 1, 2].map((row) => (
        <Skeleton key={row} className="h-10 w-full" />
      ))}
    </div>
  );
}
