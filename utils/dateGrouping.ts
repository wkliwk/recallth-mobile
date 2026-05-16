/**
 * Date grouping helpers for the History timeline.
 *
 * Groups: Today / Yesterday / This Week / <Month Year>
 */

export type GroupLabel = string;

export interface DateGroup<T = { timestamp: string }> {
  label: GroupLabel;
  items: T[];
}

/**
 * Returns a canonical group label for a given date:
 *   - "Today"
 *   - "Yesterday"
 *   - "This Week" (within the past 7 days, before yesterday)
 *   - "January 2025" etc. for older entries
 */
export function getGroupLabel(isoDate: string, now: Date = new Date()): string {
  const d = new Date(isoDate);

  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);

  const yesterdayMidnight = new Date(todayMidnight);
  yesterdayMidnight.setDate(todayMidnight.getDate() - 1);

  const weekMidnight = new Date(todayMidnight);
  weekMidnight.setDate(todayMidnight.getDate() - 7);

  const entryDay = new Date(d);
  entryDay.setHours(0, 0, 0, 0);

  if (entryDay.getTime() === todayMidnight.getTime()) return 'Today';
  if (entryDay.getTime() === yesterdayMidnight.getTime()) return 'Yesterday';
  if (entryDay >= weekMidnight) return 'This Week';

  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** Group label sort order — Today first, then Yesterday, This Week, then months descending. */
const FIXED_ORDER: Record<string, number> = {
  Today: 0,
  Yesterday: 1,
  'This Week': 2,
};

function groupSortKey(label: string): number {
  if (label in FIXED_ORDER) return FIXED_ORDER[label]!;
  // "Month Year" — parse as date for descending sort (negate)
  const d = new Date(`01 ${label}`);
  return isNaN(d.getTime()) ? 999 : -d.getTime();
}

/**
 * Takes a flat array of TimelineEntries (already sorted newest-first from API)
 * and returns an array of DateGroup objects in display order.
 *
 * @param entries - flat list from the API (newest first)
 * @param now - injectable "current time" for deterministic testing; defaults to `new Date()`
 */
export function groupByDate<T extends { timestamp: string }>(
  entries: T[],
  now: Date = new Date(),
): DateGroup<T>[] {
  const map = new Map<string, T[]>();

  for (const entry of entries) {
    const label = getGroupLabel(entry.timestamp, now);
    const existing = map.get(label);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(label, [entry]);
    }
  }

  return ([...map.entries()] as Array<[string, T[]]>)
    .map(([label, items]) => ({ label, items }))
    .sort((a, b) => groupSortKey(a.label) - groupSortKey(b.label));
}
