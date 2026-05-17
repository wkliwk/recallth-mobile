/**
 * Trends service — wraps the backend endpoints used by the Trends tab:
 *   GET /intake/streak        — current + longest streak
 *   GET /profile/weight-trend — weight history entries
 *   GET /wellness/score       — composite wellness score + breakdown
 */

import { api } from './api';

// ─── Streak ───────────────────────────────────────────────────────────────────

export interface IntakeStreak {
  currentStreak: number;
  longestStreak: number;
  /** ISO date (YYYY-MM-DD) of the last logged day, or null if never logged. */
  lastLoggedDate: string | null;
}

export async function fetchStreak(token: string): Promise<IntakeStreak> {
  // /intake/streak returns a flat object (not wrapped in success/data envelope).
  return api.get<IntakeStreak>('/intake/streak', { token });
}

// ─── Weight trend ─────────────────────────────────────────────────────────────

export interface WeightTrendEntry {
  timestamp: string; // ISO
  value: number;     // kg
  source?: string;
}

interface WeightTrendEnvelope {
  success: boolean;
  data: { entries: WeightTrendEntry[] };
  error: string | null;
}

export async function fetchWeightTrend(token: string): Promise<WeightTrendEntry[]> {
  const res = await api.get<WeightTrendEnvelope>('/profile/weight-trend', { token });
  return res.data?.entries ?? [];
}

// ─── Wellness score ───────────────────────────────────────────────────────────

export interface WellnessCategory {
  score: number;
  max: number;
  detail: string;
}

export interface WellnessScore {
  score: number;
  breakdown: {
    profileCompleteness: WellnessCategory;
    cabinetQuality: WellnessCategory;
    goalAlignment: WellnessCategory;
  };
  tips: string[];
}

interface WellnessEnvelope {
  success: boolean;
  data: WellnessScore | null;
  error: string | null;
}

export async function fetchWellnessScore(token: string): Promise<WellnessScore | null> {
  const res = await api.get<WellnessEnvelope>('/wellness/score', { token });
  return res.data ?? null;
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** YYYY-MM-DD in UTC, matching the backend's intake date format. */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Build a 7-day strip ending today.
 *
 * Uses the streak data to mark which of the last 7 days are "taken":
 * a day is considered taken if it falls inside the current-streak window
 * anchored at `lastLoggedDate` (or today/yesterday).
 *
 * This is a deliberate approximation — without a `recentDates` field on the
 * backend, we cannot show non-contiguous logging gaps. Good enough for v1.
 */
export interface DayCell {
  date: string;        // YYYY-MM-DD
  weekday: string;     // 'Mon'
  taken: boolean;
  isToday: boolean;
}

export function buildSevenDayStrip(streak: IntakeStreak | null): DayCell[] {
  const today = todayUTC();
  const todayDate = new Date(today + 'T00:00:00Z');

  // Days that are inside the current streak window.
  const insideStreak = new Set<string>();
  if (streak && streak.currentStreak > 0 && streak.lastLoggedDate) {
    let cursor = new Date(streak.lastLoggedDate + 'T00:00:00Z');
    for (let i = 0; i < streak.currentStreak; i++) {
      insideStreak.add(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
  }

  const cells: DayCell[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setUTCDate(todayDate.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({
      date: iso,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      taken: insideStreak.has(iso),
      isToday: iso === today,
    });
  }
  return cells;
}

/**
 * Compute weight delta vs the entry closest to N days ago (default 30).
 * Returns null if there's no comparable past entry.
 */
export function computeWeightDelta(
  entries: WeightTrendEntry[],
  daysBack = 30,
): { latest: number; delta: number } | null {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  const latest = sorted[sorted.length - 1];
  const cutoff = Date.now() - daysBack * 86400000;

  // Find the entry at-or-before the cutoff. Fallback: earliest entry.
  let baseline = sorted[0];
  for (const e of sorted) {
    if (new Date(e.timestamp).getTime() <= cutoff) baseline = e;
  }

  return {
    latest: latest.value,
    delta: Number((latest.value - baseline.value).toFixed(1)),
  };
}

// ─── Dose effects ─────────────────────────────────────────────────────────────

export interface DoseEffectInput {
  doseLogId: string;
  supplementId: string;
  supplementName: string;
  energy?: number;
  focus?: number;
  sleep?: number;
  mood?: number;
}

export interface SupplementEffectAvg {
  name: string;
  avgEnergy: number | null;
  avgFocus: number | null;
  avgSleep: number | null;
  avgMood: number | null;
  count: number;
}

interface EffectsEnvelope {
  success: boolean;
  data: { supplements: SupplementEffectAvg[] };
  error: string | null;
}

export async function saveEffect(token: string, input: DoseEffectInput): Promise<void> {
  await api.post('/intake/effect', input, { token });
}

export async function fetchEffects(token: string, days = 30): Promise<SupplementEffectAvg[]> {
  const res = await api.get<EffectsEnvelope>(`/effects?days=${days}`, { token });
  return res.data?.supplements ?? [];
}
