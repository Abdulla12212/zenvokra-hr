import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronDown, NotebookPen } from 'lucide-react';
import { Link } from 'react-router';

import type { LeaveBalance } from '@/lib/employee-app-types';
import { cn } from '@/lib/utils';

const ringCircumference = 75.4;

export function EmployeeLeaveCell({
  employeeId,
  remaining,
  balances,
}: {
  employeeId: string;
  remaining: number;
  balances: LeaveBalance[];
}) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const offset =
    ringCircumference - Math.min(ringCircumference, (remaining / 40) * ringCircumference);
  const tone = remaining >= 20 ? 'text-success' : 'text-primary';

  useEffect(() => {
    if (!open) {
      return;
    }

    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const width = 240;
      setCoords({
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    place();
    window.addEventListener('resize', place);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', place);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl p-1 transition-colors',
          open ? 'bg-muted/70 border' : 'hover:bg-muted',
        )}
      >
        <span className="relative flex size-8 shrink-0 items-center justify-center">
          <svg className="size-8 -rotate-90" viewBox="0 0 32 32" aria-hidden="true">
            <circle
              className="text-surface-high"
              cx="16"
              cy="16"
              fill="none"
              r="12"
              stroke="currentColor"
              strokeWidth="3"
            />
            <circle
              className={tone}
              cx="16"
              cy="16"
              fill="none"
              r="12"
              stroke="currentColor"
              strokeDasharray={ringCircumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <span className="text-label-xs absolute font-bold tracking-tight">{remaining}</span>
        </span>
        <button
          ref={triggerRef}
          type="button"
          className="text-outline hover:bg-muted hover:text-foreground grid size-6 place-items-center rounded-lg"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${String(remaining)} leave days remaining`}
          title="View leave breakdown"
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label="Leave breakdown"
              className="bg-card z-40 w-60 rounded-xl border p-3 shadow-lg"
              style={{ position: 'fixed', top: coords.top, left: coords.left }}
            >
              <div className="mb-2.5 flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-1.5">
                  <NotebookPen
                    className="text-primary-deep size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="text-body-sm font-semibold">Leave Breakdown</span>
                </div>
                <span className="bg-info-muted text-primary text-label-xs rounded-full px-2 py-0.5 font-bold">
                  {remaining}d Total
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {balances.length === 0 ? (
                  <p className="text-muted-foreground text-label-xs">No leave balances recorded.</p>
                ) : (
                  balances.map((balance) => <BalanceRow key={balance.type} balance={balance} />)
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-2.5">
                <Link
                  to={`/admin/employees/${employeeId}?tab=leave`}
                  className="text-primary-deep text-label-xs inline-flex items-center gap-0.5 font-semibold hover:underline"
                  onClick={() => setOpen(false)}
                >
                  View History
                  <ArrowRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                </Link>
                <Link
                  to={`/admin/employees/${employeeId}?tab=leave`}
                  className="bg-primary text-primary-foreground hover:bg-primary-deep text-label-xs rounded-lg px-2.5 py-1 font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Request
                </Link>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function BalanceRow({ balance }: { balance: LeaveBalance }) {
  const used = Math.max(0, balance.total - balance.remaining);
  const tone =
    balance.type === 'Annual'
      ? 'bg-primary'
      : balance.type === 'Casual'
        ? 'bg-success'
        : 'bg-muted-foreground';

  return (
    <div className="flex items-center justify-between border-b py-1 last:border-b-0">
      <div className="flex items-center gap-2">
        <span className={cn('size-2 shrink-0 rounded-full', tone)} aria-hidden="true" />
        <span className="text-muted-foreground text-label-md font-medium">
          {balance.type} Leave:
        </span>
        <span className="text-label-md font-semibold">
          {used} <span className="text-outline font-normal">/ {balance.total} days</span>
        </span>
      </div>
      <span className="bg-muted text-outline text-micro rounded px-1.5 py-0.5">
        {balance.remaining} left
      </span>
    </div>
  );
}
