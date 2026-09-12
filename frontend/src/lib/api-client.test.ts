import { describe, expect, it, vi, type MockedFunction } from 'vitest';

import { ApiError, apiFetch } from './api-client';

vi.mock('./env', () => ({
  env: { apiBaseUrl: '', isDevelopment: false },
}));

type FetchMock = MockedFunction<typeof fetch>;

function stubFetch(response: Response): FetchMock {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function firstCall(fetchMock: FetchMock): { url: string; init: RequestInit | undefined } {
  const call = fetchMock.mock.calls.at(0);

  if (!call) {
    throw new Error('fetch was never called');
  }

  const [input, init] = call;

  if (typeof input !== 'string') {
    throw new Error('apiFetch is expected to call fetch with a string URL');
  }

  return { url: input, init };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('apiFetch', () => {
  it('parses a successful JSON response', async () => {
    stubFetch(jsonResponse({ id: '1', name: 'Acme' }));

    const result = await apiFetch<{ id: string; name: string }>('/api/platform/tenants');

    expect(result).toEqual({ id: '1', name: 'Acme' });
  });

  it('sends cookies so the signed session reaches the API', async () => {
    const fetchMock = stubFetch(jsonResponse([]));

    await apiFetch('/api/auth/me');

    expect(firstCall(fetchMock).init?.credentials).toBe('include');
  });

  it('appends query parameters and drops empty ones', async () => {
    const fetchMock = stubFetch(jsonResponse([]));

    await apiFetch('/api/platform/tenants', {
      query: { page: 2, pageSize: undefined, search: null, active: true },
    });

    expect(firstCall(fetchMock).url).toBe('/api/platform/tenants?page=2&active=true');
  });

  it('serialises the body and sets the content type for writes', async () => {
    const fetchMock = stubFetch(jsonResponse({ id: '1' }, { status: 201 }));

    await apiFetch('/api/platform/tenants', { method: 'POST', body: { name: 'Acme' } });

    const { init } = firstCall(fetchMock);

    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"name":"Acme"}');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
  });

  it('turns problem details into an ApiError carrying field errors', async () => {
    stubFetch(
      jsonResponse(
        {
          title: 'One or more validation errors occurred.',
          status: 400,
          detail: 'Validation failed.',
          errors: { Name: ['Use at least 2 characters.'] },
        },
        { status: 400, headers: { 'content-type': 'application/problem+json' } },
      ),
    );

    const error = await apiFetch('/api/platform/tenants', { method: 'POST', body: {} }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiError);

    const apiError = error as ApiError;
    expect(apiError.status).toBe(400);
    expect(apiError.message).toBe('Validation failed.');
    expect(apiError.fieldErrors.Name).toEqual(['Use at least 2 characters.']);
  });

  it('falls back to a readable message when the error body is not JSON', async () => {
    stubFetch(new Response('gateway exploded', { status: 502 }));

    const error = await apiFetch('/api/platform/tenants').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('The request failed with status 502.');
  });

  it('reports an unreachable server as a network error rather than leaking fetch internals', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')),
    );

    const error = await apiFetch('/api/platform/tenants').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
  });

  it('returns nothing for a 204', async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(apiFetch('/api/platform/tenants/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
