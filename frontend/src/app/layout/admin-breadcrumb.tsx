import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function AdminBreadcrumb({
  items,
  badge,
}: {
  items: { label: string; to?: string; heading?: boolean }[];
  badge?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        to="/admin"
        className="text-label-md text-muted-foreground hover:text-primary inline-flex items-center gap-1.5"
      >
        <Home className="text-outline size-[18px]" strokeWidth={1.5} aria-hidden="true" />
        <span className="font-medium">Home</span>
      </Link>
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span className="text-outline-variant text-label-md">/</span>
          {item.to ? (
            <Link
              to={item.to}
              className="text-label-md text-muted-foreground hover:text-foreground font-medium"
            >
              {item.label}
            </Link>
          ) : item.heading ? (
            <h1 className="text-title-md text-foreground font-semibold">{item.label}</h1>
          ) : (
            <span className="text-title-md text-foreground font-semibold">{item.label}</span>
          )}
        </span>
      ))}
      {badge ? (
        <span className="bg-surface-high text-muted-foreground text-label-xs rounded-full px-2 py-0.5 font-semibold">
          {badge}
        </span>
      ) : null}
    </div>
  );
}
