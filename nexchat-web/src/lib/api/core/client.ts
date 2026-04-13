import { API_BASE_URL } from './config';
import type { ApiClientOptions, ApiContext, ApiResult } from './types';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function readJson(response: Response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    return null;
  }

  return response.json();
}

function readErrorMessage(payload: unknown, fallbackMessage: string) {
  return isRecord(payload) && typeof payload.message === 'string' ? payload.message : fallbackMessage;
}

function resolveApiContext(context?: ApiContext) {
  if (typeof context === 'function') {
    return { fetch: context, request: undefined };
  }

  return {
    fetch: context?.fetch ?? fetch,
    request: context?.request
  };
}

function withRequestHeaders(request?: Request, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const cookie = request?.headers.get('cookie');

  if (cookie && !headers.has('cookie')) {
    headers.set('cookie', cookie);
  }

  return {
    ...init,
    headers
  };
}

function jsonRequest(method: string, body?: unknown, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  return {
    ...init,
    method,
    headers,
    body: body === undefined ? init.body : JSON.stringify(body)
  };
}

function joinUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function createApiClient({
  baseUrl = API_BASE_URL,
  fetch: fetchImpl = fetch,
  request
}: ApiClientOptions = {}) {
  async function requestJson<T>(
    path: string,
    init: RequestInit,
    fallbackError = 'Request failed'
  ): Promise<ApiResult<T>> {
    const response = await fetchImpl(joinUrl(baseUrl, path), {
      credentials: 'include',
      ...withRequestHeaders(request, init)
    });

    const payload = await readJson(response);

    if (!response.ok) {
      return {
        data: null,
        error: readErrorMessage(payload, fallbackError),
        response
      };
    }

    return {
      data: payload as T,
      error: null,
      response
    };
  }

  return {
    request: requestJson,
    get<T>(path: string, fallbackError?: string) {
      return requestJson<T>(path, { method: 'GET' }, fallbackError);
    },
    post<T>(path: string, body?: unknown, fallbackError?: string) {
      return requestJson<T>(path, jsonRequest('POST', body), fallbackError);
    }
  };
}

export const apiClient = createApiClient();

export function getApiClient(context?: ApiContext) {
  if (!context) {
    return apiClient;
  }

  const resolved = resolveApiContext(context);
  return createApiClient(resolved);
}
