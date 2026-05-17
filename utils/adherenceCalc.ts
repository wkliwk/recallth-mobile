import type { DoseLogEntry } from '../services/schedule';

export interface DayAdherence {
  dateLabel: string;
  pct: number;
}

/**
 * Compute daily adherence % for a given list of dose logs and a scheduled
 * dose count per day. Returns exactly `days` entries ordered oldest→newest.
 *
 * @param logs - dose log entries (any date range)
 * @param scheduledPerDay - number of doses expected each day (e.g. cabinet size)
 * @param days - how many trailing days to compute (default 7)
 * @param referenceDate - anchor for "today" (injectable for testing, default new Date())
 */
export function computeDailyAdherence(
  logs: DoseLogEntry[],
  scheduledPerDay: number,
  days = 7,
  referenceDate: Date = new Date(),
): DayAdherence[] {
  if (scheduledPerDay <= 0) return buildEmpty(days, referenceDate);

  const countByDate = new Map<string, number>();
  for (const log of logs) {
    const date = log.takenAt.slice(0, 10);
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  const result: DayAdherence[] = [];
  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const isoDate = d.toISOString().slice(0, 10);
    const taken = countByDate.get(isoDate) ?? 0;
    const pct = Math.min(100, Math.round((taken / scheduledPerDay) * 100));
    result.push({ dateLabel: DAY_LABELS[d.getDay()] ?? '', pct });
  }
  return result;
}

function buildEmpty(days: number, referenceDate: Date): DayAdherence[] {
  const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - (days - 1 - i));
    return { dateLabel: DAY_LABELS[d.getDay()] ?? '', pct: 0 };
  });
}

/**
 * Week-over-week delta: avg(current 7 days) - avg(prior 7 days), in percentage points.
 * Returns null if fewer than 3 days of current data have any logs.
 */
export function computeWoWDelta(
  logs: DoseLogEntry[],
  scheduledPerDay: number,
  referenceDate: Date = new Date(),
): number | null {
  if (scheduledPerDay <= 0) return null;

  const countByDate = new Map<string, number>();
  for (const log of logs) {
    const date = log.takenAt.slice(0, 10);
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
  }

  const buildWeek = (offsetDays: number): number[] => {
    const pcts: number[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - offsetDays - i);
      const taken = countByDate.get(d.toISOString().slice(0, 10)) ?? 0;
      pcts.push(Math.min(100, Math.round((taken / scheduledPerDay) * 100)));
    }
    return pcts;
  };

  const currentWeek = buildWeek(0);
  const daysWithData = currentWeek.filter((p) => p > 0).length;
  if (daysWithData < 3) return null;

  const priorWeek = buildWeek(7);
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  return Math.round(avg(currentWeek) - avg(priorWeek));
}
