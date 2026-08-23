import { env } from './env';

/** Header the API reads the current tenant from. See `TenancyOptions` on the server. */
export const TENANT_HEADER = 'X-Tenant-Id';

/**
 * An RFC 9457 problem response. Every non-2xx from the API has this shape, including
 * validation failures, which add a per-field `errors` map.
 */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

/**
 * The only error type the API layer throws.
 *
 * Components and hooks can therefore branch on `status` and read `fieldErrors`
 * without ever touching `Response` or guessing at the response body.
 */
export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;
  readonly problem: ProblemDetails | undefined;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }

  /** Validation messages keyed by field name, empty when the failure was not a validation failure. */
  get fieldErrors(): Record<string, string[]> {
    return this.problem?.errors ?? {};
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Query string values; `null` and `undefined` entries are omitted. */
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

/**
 * Sends a JSON request and returns the parsed body, throwing {@link ApiError} for
 * anything that is not a success.
 *
 * Prefer the feature-level functions in `features/<name>/api` over calling this
 * directly, so that URLs and response types live next to the feature that owns them.
 */
export async function apiFetch<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = 'GET', body, query, signal } = options;

  const headers = new Headers({ Accept: 'application/json' });

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (env.devTenantId) {
    headers.set(TENANT_HEADER, env.devTenantId);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (cause) {
    // An aborted request is a caller decision, not a failure, so it propagates
    // untouched for TanStack Query to recognise.
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw cause;
    }

    throw new ApiError(0, 'The server could not be reached. Check your connection and try again.');
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

export const api = {
  get: <TResponse>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<TResponse>(path, { ...options, method: 'GET' }),

  post: <TResponse>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiFetch<TResponse>(path, { ...options, method: 'POST', body }),

  put: <TResponse>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiFetch<TResponse>(path, { ...options, method: 'PUT', body }),

  patch: <TResponse>(
    path: string,
    body: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiFetch<TResponse>(path, { ...options, method: 'PATCH', body }),

  delete: <TResponse>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiFetch<TResponse>(path, { ...options, method: 'DELETE' }),
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  }

  const queryString = search.toString();

  return `${env.apiBaseUrl}${path}${queryString ? `?${queryString}` : ''}`;
}

async function toApiError(response: Response): Promise<ApiError> {
  const problem = await readProblemDetails(response);

  const message =
    problem?.detail ?? problem?.title ?? `The request failed with status ${response.status}.`;

  return new ApiError(response.status, message, problem);
}

async function readProblemDetails(response: Response): Promise<ProblemDetails | undefined> {
  if (!response.headers.get('content-type')?.includes('json')) {
    return undefined;
  }

  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    // A malformed error body should not replace the real failure with a parse error.
    return undefined;
  }
}
