import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex h-[22px] w-fit shrink-0 items-center rounded-md border px-2 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        present:
          'border-transparent bg-[color-mix(in_oklch,var(--success)_12%,var(--background))] text-[color-mix(in_oklch,var(--success)_70%,var(--foreground))]',
        late: 'border-transparent bg-[color-mix(in_oklch,var(--warning)_16%,var(--background))] text-[color-mix(in_oklch,var(--warning)_55%,var(--foreground))]',
        pending:
          'border-transparent bg-[color-mix(in_oklch,var(--primary)_12%,var(--background))] text-primary',
        rejected:
          'border-transparent bg-[color-mix(in_oklch,var(--destructive)_12%,var(--background))] text-destructive',
        off: 'bg-secondary text-secondary-foreground border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
