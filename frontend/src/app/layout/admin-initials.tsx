import { initials } from '@/lib/initials';
import { cn } from '@/lib/utils';

export function AdminInitials({
  name,
  size = 'md',
  tone = 'muted',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'muted' | 'primary';
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-2xl font-bold',
        size === 'sm' && 'text-label-xs size-6',
        size === 'md' && 'text-title-md size-9',
        size === 'lg' && 'text-title-md size-10',
        tone === 'primary'
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-surface-high text-muted-foreground border-border border',
      )}
    >
      {initials(name)}
    </div>
  );
}
