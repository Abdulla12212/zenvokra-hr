import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { AdminStateProvider } from '@/admin/admin-state-provider';

export function renderAdminPage(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { route?: string },
): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const route = options?.route ?? '/';

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <AdminStateProvider>{children}</AdminStateProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...omitRoute(options) });
}

function omitRoute(
  options?: Omit<RenderOptions, 'wrapper'> & { route?: string },
): Omit<RenderOptions, 'wrapper'> | undefined {
  if (!options) {
    return undefined;
  }

  const { route: _route, ...rest } = options;
  return rest;
}
