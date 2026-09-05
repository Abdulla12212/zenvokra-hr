import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { homeHref } from '@/lib/home-search';

import { useDismissLateBanner } from '../api/attendance-queries';

export function LateBanner() {
  const dismiss = useDismissLateBanner();

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-[color-mix(in_oklch,var(--warning)_28%,var(--border))] bg-[color-mix(in_oklch,var(--warning)_12%,var(--background))] px-3 py-2.5 text-[13px]">
      <div>
        <strong className="block font-semibold">19 Aug marked late</strong>
        <span className="text-muted-foreground text-xs">
          Clocked in 09:42 — missed 15m grace. System recorded 42m tardiness.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={homeHref({ month: 'august', day: 19, sheet: 'fix-punch' })}>Fix punch</Link>
        </Button>
        <button
          type="button"
          className="text-muted-foreground px-1 text-base leading-none"
          aria-label="Dismiss late notice"
          onClick={() => {
            dismiss.mutate();
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
