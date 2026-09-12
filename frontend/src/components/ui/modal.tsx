import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Modal({
  open,
  title,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="bg-foreground/40 absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'bg-card text-card-foreground relative z-10 w-full max-w-md rounded-xl border p-6 shadow-lg',
          className,
        )}
      >
        <h2 id="modal-title" className="mb-4 text-base font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
