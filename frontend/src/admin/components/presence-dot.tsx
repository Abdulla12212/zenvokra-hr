import { cn } from '@/lib/utils';

export function PresenceDot({
  status,
}: {
  status: 'present' | 'late' | 'wfh' | 'sick' | 'active' | 'inactive';
}) {
  return (
    <span
      className={cn(
        'size-1.5 shrink-0 rounded-full',
        (status === 'present' || status === 'active') && 'bg-positive',
        status === 'late' && 'bg-warning',
        status === 'wfh' && 'bg-primary',
        (status === 'sick' || status === 'inactive') && 'bg-destructive',
      )}
      aria-hidden="true"
    />
  );
}
