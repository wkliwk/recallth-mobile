import { computeDailyAdherence, computeWoWDelta } from '../../utils/adherenceCalc';
import type { DoseLogEntry } from '../../services/schedule';

function makeLog(takenAt: string): DoseLogEntry {
  return {
    _id: takenAt,
    supplementId: 'sup1',
    supplementName: 'Vitamin D',
    slot: 'morning',
    takenAt,
  };
}

// Fixed reference date for deterministic tests
const REF = new Date('2026-05-17T12:00:00.000Z');

describe('computeDailyAdherence', () => {
  it('returns 7 entries for zero logs', () => {
    const result = computeDailyAdherence([], 2, 7, REF);
    expect(result).toHaveLength(7);
    result.forEach((d) => expect(d.pct).toBe(0));
  });

  it('returns 7 entries when scheduledPerDay is 0', () => {
    const result = computeDailyAdherence([], 0, 7, REF);
    expect(result).toHaveLength(7);
  });

  it('returns 100% for a day with exactly scheduledPerDay logs', () => {
    const logs = [
      makeLog('2026-05-17T08:00:00.000Z'),
      makeLog('2026-05-17T20:00:00.000Z'),
    ];
    const result = computeDailyAdherence(logs, 2, 7, REF);
    const today = result[result.length - 1];
    expect(today?.pct).toBe(100);
  });

  it('returns 50% for a day with half the scheduled logs', () => {
    const logs = [makeLog('2026-05-17T08:00:00.000Z')];
    const result = computeDailyAdherence(logs, 2, 7, REF);
    const today = result[result.length - 1];
    expect(today?.pct).toBe(50);
  });

  it('caps at 100% even when more logs than scheduled', () => {
    const logs = [
      makeLog('2026-05-17T08:00:00.000Z'),
      makeLog('2026-05-17T12:00:00.000Z'),
      makeLog('2026-05-17T18:00:00.000Z'),
    ];
    const result = computeDailyAdherence(logs, 2, 7, REF);
    const today = result[result.length - 1];
    expect(today?.pct).toBe(100);
  });

  it('only counts logs for each specific day', () => {
    const logs = [
      makeLog('2026-05-16T08:00:00.000Z'), // yesterday
      makeLog('2026-05-16T20:00:00.000Z'), // yesterday
    ];
    const result = computeDailyAdherence(logs, 2, 7, REF);
    const today = result[result.length - 1];
    const yesterday = result[result.length - 2];
    expect(today?.pct).toBe(0);
    expect(yesterday?.pct).toBe(100);
  });

  it('includes correct day labels (oldest to newest)', () => {
    const result = computeDailyAdherence([], 2, 7, REF);
    // REF is 2026-05-17 (Sunday = day 0)
    expect(result[result.length - 1]?.dateLabel).toBe('Su');
  });
});

describe('computeWoWDelta', () => {
  it('returns null when scheduledPerDay is 0', () => {
    expect(computeWoWDelta([], 0, REF)).toBeNull();
  });

  it('returns null when fewer than 3 days have data', () => {
    const logs = [
      makeLog('2026-05-17T08:00:00.000Z'),
      makeLog('2026-05-16T08:00:00.000Z'),
    ];
    expect(computeWoWDelta(logs, 2, REF)).toBeNull();
  });

  it('returns positive delta when current week is better', () => {
    // 7 days of current week (100% each)
    const currentLogs = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(REF);
      d.setDate(d.getDate() - i);
      return makeLog(d.toISOString());
    });
    // 7 days of prior week (50% each — 1 log out of 2 scheduled)
    // No prior logs → 0% for prior week
    const delta = computeWoWDelta(currentLogs, 1, REF);
    expect(delta).not.toBeNull();
    expect(delta!).toBeGreaterThan(0);
  });

  it('returns 0 delta when both weeks are equal', () => {
    // 7 current + 7 prior, same count each day
    const logs = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(REF);
      d.setDate(d.getDate() - i);
      return makeLog(d.toISOString());
    });
    const delta = computeWoWDelta(logs, 1, REF);
    expect(delta).toBe(0);
  });
});
