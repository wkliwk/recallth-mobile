/**
 * Recallth backend API client.
 *
 * Reads `EXPO_PUBLIC_API_URL` from the environment (set in `.env` or via EAS).
 * Defaults to the deployed fly.io URL so dev builds still function without
 * an explicit env var, but production builds should always set the variable
 * via EAS environment configuration.
 */

const DEFAULT_API_URL = 'https://recallth-backend.fly.dev';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Optional bearer token. Once auth lands this will come from secure storage. */
  token?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Thin fetch wrapper. Intentionally minimal — we'll layer TanStack Query and
 * auth (expo-secure-store) on top of this in later issues (#7/#8).
 */
export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { body, token, headers, ...rest } = options;

  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((headers as Record<string, string> | undefined) ?? {}),
  };

  const response = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as TResponse;
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
