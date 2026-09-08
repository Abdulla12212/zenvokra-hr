import { Plus, UserPlus } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminAddEmployeeButton({
  onClick,
  compact = false,
}: {
  onClick?: () => void;
  compact?: boolean;
}) {
  const className = compact
    ? 'text-label-md hover:bg-primary-deep h-auto gap-1.5 self-start rounded-lg px-3 py-1.5 font-medium shadow-sm'
    : 'text-body-sm hover:bg-primary-deep h-9 gap-1.5 self-start rounded-xl px-4 font-medium shadow-sm';

  const label = (
    <>
      {compact ? (
        <Plus className="size-3.5" strokeWidth={2} aria-hidden="true" />
      ) : (
        <UserPlus className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
      )}
      Add Employee
      {compact ? (
        <kbd
          className="bg-primary-foreground/20 text-micro hidden rounded px-1.5 py-0.5 leading-none sm:inline-block"
          aria-hidden="true"
        >
          N
        </kbd>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <Button type="button" className={cn(className)} onClick={onClick}>
        {label}
      </Button>
    );
  }

  return (
    <Button className={cn(className)} asChild>
      <Link to="/admin/employees">{label}</Link>
    </Button>
  );
}
