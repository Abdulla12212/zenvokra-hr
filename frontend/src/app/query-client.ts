import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api-client';

/**
 * Builds the TanStack Query client with the defaults this app wants everywhere.
 *
 * A factory rather than a module-level singleton, so tests get an empty cache per
 * test and one test can never see another's data.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // HR data changes on human timescales; refetching every mount is wasteful.
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // A 4xx means the request was wrong. Repeating it will not make it right.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }

          return failureCount < 2;
        },
      },
      mutations: {
        // Retrying a write risks doing it twice. Revisit once mutating endpoints
        // accept idempotency keys — see docs/ARCHITECTURE.md.
        retry: false,
      },
    },
  });
}
