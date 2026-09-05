import { useRouteError } from 'react-router';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { env } from '@/lib/env';

/**
 * Last line of defence for a render or loader error anywhere under the root route.
 * Without it, React Router shows its own stack-trace page in production.
 */
export function RouteErrorPage() {
  const error = useRouteError();

  return (
    <div className="space-y-4 overflow-auto p-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted-foreground mx-auto max-w-md text-sm">{describe(error)}</p>

      {env.isDevelopment && error instanceof Error ? (
        <pre className="bg-muted text-muted-foreground mx-auto max-w-2xl overflow-x-auto rounded-md p-4 text-left text-xs">
          {error.stack ?? error.message}
        </pre>
      ) : null}

      <Button variant="outline" onClick={() => window.location.reload()}>
        Reload
      </Button>
    </div>
  );
}

function describe(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return env.isDevelopment ? error.message : 'An unexpected error occurred.';
  }

  return 'An unexpected error occurred.';
}
