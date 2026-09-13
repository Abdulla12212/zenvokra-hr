import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        present: 'border-success-border bg-success-muted text-success',
        late: 'border-warning-border bg-warning-muted text-warning',
        pending: 'border-info-border bg-info-muted text-primary',
        rejected: 'border-destructive-border bg-destructive-muted text-destructive',
        off: 'bg-muted text-muted-foreground border-border',
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
