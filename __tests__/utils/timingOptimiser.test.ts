import type { DoseLogEntry } from '../../services/schedule';
import type { SupplementEffectAvg } from '../../services/trends';
import { computeOptimalBlock } from '../../utils/timingOptimiser';

function makeDoseLog(slot: string, supplementId = 'sup1'): DoseLogEntry {
  return {
    _id: Math.random().toString(),
    supplementId,
    supplementName: 'Magnesium',
    slot,
    takenAt: new Date().toISOString(),
  };
}

function makeEffectAvg(count: number, overrides?: Partial<SupplementEffectAvg>): SupplementEffectAvg {
  return {
    name: 'Magnesium',
    avgEnergy: 4,
    avgFocus: 3,
    avgSleep: 5,
    avgMood: 4,
    count,
    ...overrides,
  };
}

describe('computeOptimalBlock', () => {
  it('returns null when effectAvg is null', () => {
    const logs = Array(10).fill(null).map(() => makeDoseLog('morning'));
    expect(computeOptimalBlock(logs, null)).toBeNull();
  });

  it('returns null when fewer than 7 effect ratings', () => {
    const logs = Array(10).fill(null).map(() => makeDoseLog('morning'));
    expect(computeOptimalBlock(logs, makeEffectAvg(6))).toBeNull();
  });

  it('returns null when no dose logs', () => {
    expect(computeOptimalBlock([], makeEffectAvg(10))).toBeNull();
  });

  it('returns dominant slot with correct score (exactly 7 ratings)', () => {
    const logs = Array(8).fill(null).map(() => makeDoseLog('night'));
    const result = computeOptimalBlock(logs, makeEffectAvg(7));
    expect(result).not.toBeNull();
    expect(result!.dominantSlot).toBe('night');
    expect(result!.slotLabel).toBe('Night');
    expect(result!.sampleCount).toBe(7);
    expect(result!.doseCount).toBe(8);
  });

  it('picks the slot with the most logs as dominant', () => {
    const logs = [
      ...Array(3).fill(null).map(() => makeDoseLog('morning')),
      ...Array(7).fill(null).map(() => makeDoseLog('evening')),
      ...Array(2).fill(null).map(() => makeDoseLog('night')),
    ];
    const result = computeOptimalBlock(logs, makeEffectAvg(15));
    expect(result!.dominantSlot).toBe('evening');
  });

  it('computes overall score as mean of non-null averages', () => {
    const logs = Array(10).fill(null).map(() => makeDoseLog('morning'));
    const effectAvg = makeEffectAvg(10, {
      avgEnergy: 4,
      avgFocus: 2,
      avgSleep: null,
      avgMood: 3,
    });
    const result = computeOptimalBlock(logs, effectAvg);
    // mean of [4, 2, 3] = 3.0
    expect(result!.overallScore).toBe(3);
  });

  it('returns null when all average categories are null', () => {
    const logs = Array(10).fill(null).map(() => makeDoseLog('morning'));
    const effectAvg = makeEffectAvg(10, {
      avgEnergy: null,
      avgFocus: null,
      avgSleep: null,
      avgMood: null,
    });
    expect(computeOptimalBlock(logs, effectAvg)).toBeNull();
  });

  it('rounds score to one decimal place', () => {
    const logs = Array(10).fill(null).map(() => makeDoseLog('morning'));
    const effectAvg = makeEffectAvg(10, { avgEnergy: 4, avgFocus: 3, avgSleep: 5, avgMood: null });
    const result = computeOptimalBlock(logs, effectAvg);
    // mean of [4, 3, 5] = 4.0
    expect(result!.overallScore).toBe(4);
  });

  it('handles single-slot scenario', () => {
    const logs = Array(15).fill(null).map(() => makeDoseLog('midday'));
    const result = computeOptimalBlock(logs, makeEffectAvg(12));
    expect(result!.dominantSlot).toBe('midday');
    expect(result!.slotLabel).toBe('Midday');
    expect(result!.doseCount).toBe(15);
  });
});
