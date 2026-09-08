import type { ReactNode } from 'react';

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-headline-lg font-semibold">{children}</h1>;
}
