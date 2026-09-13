import { cn } from '@/lib/utils';

type DotTone = 'ok' | 'warn' | 'leave' | 'closed' | 'mute' | 'primary';

const tones: Record<DotTone, string> = {
  ok: 'bg-success',
  warn: 'bg-warning',
  leave: 'bg-primary',
  closed: 'bg-destructive',
  mute: 'bg-border',
  primary: 'bg-primary',
};

export function StatusDot({ tone, className }: { tone: DotTone; className?: string }) {
  return (
    <i
      aria-hidden="true"
      className={cn('inline-block size-1.5 shrink-0 rounded-full', tones[tone], className)}
    />
  );
}
