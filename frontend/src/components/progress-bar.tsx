import { cn } from '@/lib/utils';

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const width = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('bg-muted h-1.5 overflow-hidden rounded-full', className)}>
      <div className="bg-primary h-full rounded-full" style={{ width: `${String(width)}%` }} />
    </div>
  );
}
