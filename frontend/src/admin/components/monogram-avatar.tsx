import { cn } from '@/lib/utils';

export function MonogramAvatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <span
      className={cn(
        'bg-secondary text-secondary-foreground inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tracking-wide',
        className,
      )}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
