/**
 * Tests for dateGrouping utility.
 *
 * Covers:
 *   - getGroupLabel: Today, Yesterday, This Week, Month Year
 *   - groupByDate: groups maintained in display order (Today first)
 *   - Edge case: same-day multiple entries go into the same group
 */

import { TimelineEntry } from '../../services/history';
import { getGroupLabel, groupByDate } from '../../utils/dateGrouping';

// Fixed reference: 2025-05-09 (Friday), noon UTC
const NOW = new Date('2025-05-09T12:00:00Z');

function iso(offsetDays: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString();
}

function makeConversation(timestamp: string, id: string): TimelineEntry {
  return {
    type: 'conversation',
    timestamp,
    summary: 'Test conversation',
    data: {
      _id: id,
      title: 'Test',
      createdAt: timestamp,
      messageCount: 1,
      firstMessage: 'Hello',
    },
  };
}

describe('getGroupLabel', () => {
  it('labels an entry from today as "Today"', () => {
    expect(getGroupLabel(iso(0), NOW)).toBe('Today');
  });

  it('labels an entry from yesterday as "Yesterday"', () => {
    expect(getGroupLabel(iso(1), NOW)).toBe('Yesterday');
  });

  it('labels an entry from 3 days ago as "This Week"', () => {
    expect(getGroupLabel(iso(3), NOW)).toBe('This Week');
  });

  it('labels an entry from 6 days ago as "This Week"', () => {
    expect(getGroupLabel(iso(6), NOW)).toBe('This Week');
  });

  it('labels an entry from 8 days ago with month+year', () => {
    const label = getGroupLabel(iso(8), NOW);
    // Should be a month + year string, not one of the fixed labels
    expect(label).not.toBe('Today');
    expect(label).not.toBe('Yesterday');
    expect(label).not.toBe('This Week');
    expect(label).toMatch(/\d{4}/); // contains a year
  });
});

describe('groupByDate', () => {
  it('returns empty array for empty input', () => {
    expect(groupByDate([])).toEqual([]);
  });

  it('creates one group per distinct date label', () => {
    const entries: TimelineEntry[] = [
      makeConversation(iso(0), 'a'),
      makeConversation(iso(0), 'b'),
      makeConversation(iso(1), 'c'),
    ];
    const groups = groupByDate(entries, NOW);
    expect(groups.length).toBe(2);
  });

  it('puts Today before Yesterday', () => {
    const entries: TimelineEntry[] = [
      makeConversation(iso(1), 'yesterday'),
      makeConversation(iso(0), 'today'),
    ];
    const groups = groupByDate(entries, NOW);
    expect(groups[0]?.label).toBe('Today');
    expect(groups[1]?.label).toBe('Yesterday');
  });

  it('puts Today > Yesterday > This Week in order', () => {
    const entries: TimelineEntry[] = [
      makeConversation(iso(3), 'thisweek'),
      makeConversation(iso(0), 'today'),
      makeConversation(iso(1), 'yesterday'),
    ];
    const groups = groupByDate(entries, NOW);
    expect(groups[0]?.label).toBe('Today');
    expect(groups[1]?.label).toBe('Yesterday');
    expect(groups[2]?.label).toBe('This Week');
  });

  it('groups two entries on the same day into one group', () => {
    const entries: TimelineEntry[] = [
      makeConversation(iso(0), 'a'),
      makeConversation(iso(0), 'b'),
    ];
    const groups = groupByDate(entries, NOW);
    expect(groups.length).toBe(1);
    expect(groups[0]?.items.length).toBe(2);
  });

  it('handles cabinet_change entries', () => {
    const cabinetEntry: TimelineEntry = {
      type: 'cabinet_change',
      timestamp: iso(0),
      summary: 'Added Vitamin D',
      data: {
        _id: 'log-1',
        userId: 'user-1',
        itemName: 'Vitamin D',
        action: 'added',
        timestamp: iso(0),
      },
    };
    const groups = groupByDate([cabinetEntry], NOW);
    expect(groups.length).toBe(1);
    expect(groups[0]?.label).toBe('Today');
    expect(groups[0]?.items[0]?.type).toBe('cabinet_change');
  });
});
