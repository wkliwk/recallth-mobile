import Fuse from 'fuse.js';

// ─── Helpers (duplicated from history screen for pure unit testing) ──────────

type DatePreset = 'all' | 'today' | 'week' | 'month';

function presetStartDate(preset: DatePreset): Date | null {
  const now = new Date();
  if (preset === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (preset === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (preset === 'month') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

interface Entry {
  summary: string;
  timestamp: string;
  data?: { supplementName?: string };
}

function filterByDate(entries: Entry[], preset: DatePreset): Entry[] {
  const cutoff = presetStartDate(preset);
  if (!cutoff) return entries;
  return entries.filter((e) => new Date(e.timestamp) >= cutoff);
}

function filterBySearch(entries: Entry[], query: string): Entry[] {
  if (!query.trim()) return entries;
  const fuse = new Fuse(entries, {
    keys: ['summary', 'data.supplementName'],
    threshold: 0.4,
    minMatchCharLength: 2,
  });
  return fuse.search(query.trim()).map((r) => r.item);
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const todayIso = new Date().toISOString();
const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString(); })();
const eightDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 8); return d.toISOString(); })();
const thirtyDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString(); })();
const fortyDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 40); return d.toISOString(); })();

const entries: Entry[] = [
  { summary: 'Vitamin D — morning', timestamp: todayIso, data: { supplementName: 'Vitamin D' } },
  { summary: 'Magnesium — evening', timestamp: yesterday, data: { supplementName: 'Magnesium' } },
  { summary: 'Omega-3 — morning', timestamp: eightDaysAgo, data: { supplementName: 'Omega-3' } },
  { summary: 'Zinc — morning', timestamp: thirtyDaysAgo, data: { supplementName: 'Zinc' } },
  { summary: 'Ashwagandha — evening', timestamp: fortyDaysAgo, data: { supplementName: 'Ashwagandha' } },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('presetStartDate', () => {
  it('returns null for all', () => {
    expect(presetStartDate('all')).toBeNull();
  });

  it('returns start of today for today', () => {
    const result = presetStartDate('today')!;
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    const today = new Date();
    expect(result.toDateString()).toBe(today.toDateString());
  });

  it('returns 6 days ago for week', () => {
    const result = presetStartDate('week')!;
    const expected = new Date();
    expected.setDate(expected.getDate() - 6);
    expected.setHours(0, 0, 0, 0);
    expect(result.toDateString()).toBe(expected.toDateString());
  });

  it('returns 29 days ago for month', () => {
    const result = presetStartDate('month')!;
    const expected = new Date();
    expected.setDate(expected.getDate() - 29);
    expected.setHours(0, 0, 0, 0);
    expect(result.toDateString()).toBe(expected.toDateString());
  });
});

describe('filterByDate', () => {
  it('returns all entries for all preset', () => {
    expect(filterByDate(entries, 'all')).toHaveLength(5);
  });

  it('returns only today\'s entries for today', () => {
    const result = filterByDate(entries, 'today');
    expect(result).toHaveLength(1);
    expect(result[0].data?.supplementName).toBe('Vitamin D');
  });

  it('returns entries from last 7 days for week', () => {
    const result = filterByDate(entries, 'week');
    // today + yesterday (both within 6 days), omega-3 (8 days ago) is outside
    expect(result.length).toBe(2);
    const names = result.map((e) => e.data?.supplementName);
    expect(names).toContain('Vitamin D');
    expect(names).toContain('Magnesium');
  });

  it('returns entries from last 30 days for month', () => {
    const result = filterByDate(entries, 'month');
    // today, yesterday, omega-3 (8 days ago), zinc (30 days ago — exactly at boundary means borderline)
    // zinc is exactly 30 days ago; cutoff is 29 days ago midnight so zinc may/may not be included
    // We test the ones definitely included
    const names = result.map((e) => e.data?.supplementName);
    expect(names).toContain('Vitamin D');
    expect(names).toContain('Magnesium');
    expect(names).toContain('Omega-3');
    expect(names).not.toContain('Ashwagandha'); // 40 days ago, definitely excluded
  });
});

describe('filterBySearch', () => {
  it('returns all entries for empty query', () => {
    expect(filterBySearch(entries, '')).toHaveLength(5);
    expect(filterBySearch(entries, '   ')).toHaveLength(5);
  });

  it('finds exact supplement name match', () => {
    const result = filterBySearch(entries, 'Magnesium');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].data?.supplementName).toBe('Magnesium');
  });

  it('finds partial/fuzzy name match', () => {
    const result = filterBySearch(entries, 'vitam');
    expect(result.length).toBeGreaterThan(0);
    const names = result.map((e) => e.data?.supplementName);
    expect(names).toContain('Vitamin D');
  });
});

describe('combined date + search filter', () => {
  it('narrows results when both active', () => {
    const dateFiltered = filterByDate(entries, 'week');
    const result = filterBySearch(dateFiltered, 'Magnesium');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].data?.supplementName).toBe('Magnesium');
  });

  it('returns empty when name matches but outside date range', () => {
    const dateFiltered = filterByDate(entries, 'today');
    const result = filterBySearch(dateFiltered, 'Magnesium');
    expect(result).toHaveLength(0);
  });

  it('empty state triggered when no results', () => {
    const dateFiltered = filterByDate(entries, 'today');
    const result = filterBySearch(dateFiltered, 'Ashwagandha');
    expect(result).toHaveLength(0);
  });
});
