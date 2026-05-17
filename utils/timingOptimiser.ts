import type { DoseLogEntry } from '../services/schedule';

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
