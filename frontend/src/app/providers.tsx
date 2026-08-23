import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';
import { env } from '@/lib/env';

import { createQueryClient } from './query-client';

/**
 * Every app-wide context in one place. Tests render their subject inside this (or a
 * lighter wrapper from `src/test`) rather than duplicating provider setup.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  // Created once per mount instead of once per render, which a bare
  // `createQueryClient()` call in the body would do — throwing away the cache on
  // every state change.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      {env.isDevelopment ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
