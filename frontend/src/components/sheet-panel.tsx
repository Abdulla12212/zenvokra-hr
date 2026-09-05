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
        'bg-card flex shrink-0 flex-col gap-3.5 overflow-auto border-l p-6',
        wide ? 'w-[400px]' : 'w-[360px]',
        className,
      )}
    >
      {children}
    </aside>
  );
}
