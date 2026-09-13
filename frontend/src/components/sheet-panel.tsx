import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface SheetPanelProps {
  children: ReactNode;
  className?: string;
  wide?: boolean;
}

export function SheetPanel({ children, className, wide = false }: SheetPanelProps) {
  return (
    <aside
      className={cn(
        'bg-card flex shrink-0 flex-col gap-3.5 overflow-auto rounded-xl border p-6 shadow-sm',
        wide ? 'w-full max-w-[400px]' : 'w-full max-w-[360px]',
        className,
      )}
    >
      {children}
    </aside>
  );
}
