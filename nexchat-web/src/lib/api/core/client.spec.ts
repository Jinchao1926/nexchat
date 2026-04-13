import { describe, expect, it, vi } from 'vitest';

import { createApiClient, getApiClient } from './client';

describe('api core client', () => {
  it('uses base url, includes credentials, and sends json payloads with post', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const client = createApiClient({
      baseUrl: 'http://localhost:6001/api/v1',
      fetch: fetchMock as typeof fetch
    });

    const result = await client.post<{ ok: boolean }>('/health', { ping: true });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:6001/api/v1/health',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ ping: true })
      })
    );
    expect(result).toEqual({
      data: { ok: true },
      error: null,
      response: expect.any(Response)
    });
  });

  it('supports get for simple json requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const client = createApiClient({
      baseUrl: 'http://localhost:6001/api/v1',
      fetch: fetchMock as typeof fetch
    });

    const result = await client.get<{ ok: boolean }>('/health', 'Fallback');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:6001/api/v1/health',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include'
      })
    );
    expect(result).toEqual({
      data: { ok: true },
      error: null,
      response: expect.any(Response)
    });
  });

  it('supports absolute urls for compatibility with full backend endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ token: 'ok' }));
    const client = createApiClient({ baseUrl: '', fetch: fetchMock as typeof fetch });

    const result = await client.post<{ token: string }>('http://localhost:6001/test', { hello: 'world' });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:6001/test', expect.anything());
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ hello: 'world' }));
    expect(result).toEqual({ data: { token: 'ok' }, error: null, response: expect.any(Response) });
  });

  it('prefers server message when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ message: 'Denied' }, { status: 403 })
    );
    const client = createApiClient({
      baseUrl: 'http://localhost:6001/api/v1',
      fetch: fetchMock as typeof fetch
    });

    const result = await client.get('/health', 'Fallback');

    expect(result).toMatchObject({ data: null, error: 'Denied' });
  });

  it('returns fallback message when json error body is absent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    const client = createApiClient({
      baseUrl: 'http://localhost:6001/api/v1',
      fetch: fetchMock as typeof fetch
    });

    const result = await client.get('/health', 'Fallback');

    expect(result).toMatchObject({ data: null, error: 'Fallback' });
  });

  it('creates a scoped client that forwards cookie header for server-side requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    const client = getApiClient({
      fetch: fetchMock as typeof fetch,
      request: new Request('http://localhost:5173/app', {
        headers: {
          cookie: 'session=abc'
        }
      })
    });

    await client.get('/health');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get('cookie')).toBe('session=abc');
  });
});
