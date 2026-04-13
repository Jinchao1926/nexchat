export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  response: Response;
}

export type ApiContext =
  | typeof fetch
  | {
      fetch?: typeof fetch;
      request?: Request;
    };

export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  request?: Request;
}
