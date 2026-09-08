import { cn } from '@/lib/utils';

export function AdminFilterChip({
  label,
  count,
  active,
  onClick,
  filled,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  filled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-label-md inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors',
        filled && 'rounded-lg px-3.5',
        filled && active
          ? 'bg-primary text-primary-foreground text-body-sm font-semibold shadow-sm'
          : active
            ? 'bg-muted text-foreground font-semibold shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium',
      )}
    >
      {label}
      {count !== undefined ? (
        filled ? (
          <span
            className={cn(
              'text-label-xs rounded-full px-1.5 py-0.5 font-semibold',
              active ? 'bg-card text-primary' : 'text-outline font-normal',
            )}
          >
            {count}
          </span>
        ) : (
          <span className={cn('font-normal', active ? 'text-muted-foreground' : 'text-outline')}>
            {count}
          </span>
        )
      ) : null}
    </button>
  );
}
