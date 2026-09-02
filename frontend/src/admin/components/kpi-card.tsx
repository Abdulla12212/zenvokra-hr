import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'negative' | 'primary';
}) {
  return (
    <article className="bg-card rounded-xl border px-3 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p
        className={cn(
          'mt-1 text-[11px]',
          tone === 'positive' && 'text-positive',
          tone === 'negative' && 'text-destructive',
          tone === 'primary' && 'text-primary',
        )}
      >
        {delta}
      </p>
    </article>
  );
}
