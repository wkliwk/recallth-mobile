/**
 * Auth API wrapper.
 *
 * Backend (recallth-backend, fly.io) auth contract:
 *   POST /auth/login    body { email, password } -> { success, data: { token, userId, email }, error }
 *   POST /auth/register body { email, password } -> { success, data: { token, userId, email }, error }
 *
 * On non-2xx, backend returns { success: false, data: null, error: '<message>' };
 * `apiRequest` already throws `ApiError` in that case, so callers only need
 * to handle thrown errors.
 */

import { api, ApiError } from './api';

export type AuthUser = {
  userId: string;
  email: string;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

type AuthEnvelope = {
  success: boolean;
  data: {
    token: string;
    userId: string;
    email: string;
  } | null;
  error: string | null;
};

function unwrap(envelope: AuthEnvelope): AuthResult {
  if (!envelope.success || !envelope.data) {
    throw new Error(envelope.error ?? 'Authentication failed');
  }
  const { token, userId, email } = envelope.data;
  return { token, user: { userId, email } };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const envelope = await api.post<AuthEnvelope>('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
  });
  return unwrap(envelope);
}

export async function register(email: string, password: string): Promise<AuthResult> {
  const envelope = await api.post<AuthEnvelope>('/auth/register', {
    email: email.trim().toLowerCase(),
    password,
  });
  return unwrap(envelope);
}

export { ApiError };
