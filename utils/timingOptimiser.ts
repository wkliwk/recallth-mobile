import type { DoseLogEntry } from '../services/schedule';
import type { SupplementEffectAvg } from '../services/trends';

export interface TimingSuggestion {
  supplementId: string;
  supplementName: string;
  scheduledSlot: string;
  scheduledHour: number;
  medianActualHour: number;
  deviationMinutes: number;
  label: string;
}

const SLOT_HOURS: Record<string, number> = {
  morning: 8,
  midday: 12,
  evening: 18,
  night: 22,
};

const MIN_LOGS = 5;
const DEVIATION_THRESHOLD_MINUTES = 60;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function toHourDecimal(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

function formatHour(decimalHour: number): string {
  const h = Math.round(decimalHour);
  const clamped = ((h % 24) + 24) % 24;
  if (clamped === 0) return '12:00 AM';
  if (clamped === 12) return '12:00 PM';
  return clamped < 12 ? `${clamped}:00 AM` : `${clamped - 12}:00 PM`;
}

export function analyseTimingPatterns(doseLogs: DoseLogEntry[]): TimingSuggestion[] {
  // Group logs by supplementId + slot
  const groups = new Map<string, { name: string; slot: string; hours: number[] }>();

  for (const log of doseLogs) {
    const key = `${log.supplementId}::${log.slot}`;
    if (!groups.has(key)) {
      groups.set(key, { name: log.supplementName, slot: log.slot, hours: [] });
    }
    groups.get(key)!.hours.push(toHourDecimal(log.takenAt));
  }

  const suggestions: TimingSuggestion[] = [];

  for (const [key, { name, slot, hours }] of groups) {
    if (hours.length < MIN_LOGS) continue;

    const scheduledHour = SLOT_HOURS[slot];
    if (scheduledHour == null) continue;

    const medianHour = median(hours);
    const deviationMinutes = Math.abs(medianHour - scheduledHour) * 60;

    if (deviationMinutes <= DEVIATION_THRESHOLD_MINUTES) continue;

    const supplementId = key.split('::')[0];
    suggestions.push({
      supplementId,
      supplementName: name,
      scheduledSlot: slot,
      scheduledHour,
      medianActualHour: medianHour,
      deviationMinutes: Math.round(deviationMinutes),
      label: formatHour(medianHour),
    });
  }

  return suggestions;
}

// ─── Optimal block computation ────────────────────────────────────────────────

const MIN_EFFECT_RATINGS = 7;

const SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
  night: 'Night',
};

export interface OptimalBlockResult {
  dominantSlot: string;
  slotLabel: string;
  overallScore: number;
  sampleCount: number;
  doseCount: number;
}

/**
 * Returns the dominant dosing slot + overall effect score for a supplement.
 * Requires ≥7 effect ratings; returns null if insufficient data.
 *
 * Rationale: the backend only stores aggregate effect averages (not per-slot).
 * We therefore attribute the overall score to the slot the user most commonly
 * uses, giving an honest, data-backed recommendation without requiring new
 * backend endpoints.
 */
export function computeOptimalBlock(
  doseLogs: DoseLogEntry[],
  effectAvg: SupplementEffectAvg | null,
): OptimalBlockResult | null {
  if (!effectAvg || effectAvg.count < MIN_EFFECT_RATINGS) return null;
  if (doseLogs.length === 0) return null;

  // Count doses per slot
  const slotCounts = new Map<string, number>();
  for (const log of doseLogs) {
    slotCounts.set(log.slot, (slotCounts.get(log.slot) ?? 0) + 1);
  }

  // Find slot with highest count
  let dominantSlot = '';
  let maxCount = 0;
  for (const [slot, count] of slotCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominantSlot = slot;
    }
  }

  if (!dominantSlot || !SLOT_LABELS[dominantSlot]) return null;

  // Compute overall score (mean of non-null category averages)
  const vals = [
    effectAvg.avgEnergy,
    effectAvg.avgFocus,
    effectAvg.avgSleep,
    effectAvg.avgMood,
  ].filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  const overallScore = vals.reduce((sum, v) => sum + v, 0) / vals.length;

  return {
    dominantSlot,
    slotLabel: SLOT_LABELS[dominantSlot],
    overallScore: Math.round(overallScore * 10) / 10,
    sampleCount: effectAvg.count,
    doseCount: maxCount,
  };
}
