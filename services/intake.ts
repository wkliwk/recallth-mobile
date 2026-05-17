/**
 * Intake service — wraps POST /intake/log.
 *
 * `/intake/log` is idempotent per (user, day) on the backend. We still
 * guard against duplicate in-flight calls from rapid taps via a module-
 * level promise cache keyed by token.
 */

import { api } from './api';

export interface IntakeLogResult {
  date: string;          // YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
  freezeGranted?: boolean;
  freezeTokens?: number;
}

const inFlight = new Map<string, Promise<IntakeLogResult>>();

/**
 * POST /intake/log — mark today as taken for the current user.
 *
 * Concurrent calls with the same token share a single in-flight request;
 * subsequent calls resolve to the cached result and the cache is cleared
 * when the promise settles.
 */
export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
  freezeTokens?: number;
}

export function getStreak(token: string): Promise<StreakResult> {
  return api.get<StreakResult>('/intake/streak', { token });
}

export interface ApplyFreezeResult {
  streak: number;
  tokensLeft: number;
}

export function applyStreakFreeze(token: string): Promise<ApplyFreezeResult> {
  return api.post<ApplyFreezeResult>('/intake/apply-freeze', undefined, { token });
}

export function logIntakeToday(token: string): Promise<IntakeLogResult> {
  const cached = inFlight.get(token);
  if (cached) return cached;

  const p = api
    .post<IntakeLogResult>('/intake/log', undefined, { token })
    .finally(() => {
      inFlight.delete(token);
    });

  inFlight.set(token, p);
  return p;
}
