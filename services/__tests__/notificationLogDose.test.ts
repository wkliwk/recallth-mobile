// Must mock native modules before imports
jest.mock('expo-notifications', () => ({
  setNotificationCategoryAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  SchedulableTriggerInputTypes: { CALENDAR: 'calendar', DATE: 'date' },
}));

jest.mock('expo', () => ({ isRunningInExpoGo: jest.fn(() => false) }));
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('../intake', () => ({ getStreak: jest.fn() }));

import { handleLogDoseResponse, flushPendingDoseLogs, PendingDoseLog } from '../notifications';
import type * as ExpoNotifications from 'expo-notifications';

// ─── Mock storage ─────────────────────────────────────────────────────────────

const store: Record<string, string> = {};

jest.mock('../storage', () => ({
  getItem: async (key: string) => store[key] ?? null,
  setItem: async (key: string, value: string) => { store[key] = value; },
  deleteItem: async (key: string) => { delete store[key]; },
}));

// ─── Mock logDose (schedule service) ──────────────────────────────────────────

const mockLogDose = jest.fn().mockResolvedValue({ _id: 'log1' });
jest.mock('../schedule', () => ({
  logDose: (...args: unknown[]) => mockLogDose(...args),
  getDoseLogsRange: jest.fn(),
  unlogDose: jest.fn(),
  editDoseLog: jest.fn(),
  getTodayDoseLogs: jest.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PENDING_QUEUE_KEY = 'recallth:pending-dose-log:queue';

function makeResponse(
  actionId: string,
  supplementIds: { id: string; name: string }[] = [],
  slot = 'morning',
): ExpoNotifications.NotificationResponse {
  return {
    actionIdentifier: actionId,
    notification: {
      request: {
        identifier: 'test-notif',
        trigger: {} as ExpoNotifications.NotificationTrigger,
        content: {
          title: 'Test',
          body: 'Test',
          data: { supplementIds, slot, block: slot, screen: 'home' },
          sound: null,
          badge: null,
          subtitle: null,
          categoryIdentifier: 'LOG_DOSE',
          launchImageName: '',
          attachments: [],
        },
        expirationTime: null,
      },
      date: Date.now(),
    },
    userText: undefined,
  } as unknown as ExpoNotifications.NotificationResponse;
}

function readQueue(): PendingDoseLog[] {
  const raw = store[PENDING_QUEUE_KEY];
  if (!raw) return [];
  return JSON.parse(raw) as PendingDoseLog[];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  mockLogDose.mockClear();
});

describe('handleLogDoseResponse', () => {
  it('does nothing for non-TAKE action', async () => {
    await handleLogDoseResponse(makeResponse('SNOOZE', [{ id: 'sup1', name: 'Vitamin D' }]));
    expect(readQueue()).toHaveLength(0);
  });

  it('does nothing when supplementIds is empty', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', []));
    expect(readQueue()).toHaveLength(0);
  });

  it('adds entry to queue for TAKE action', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }]));
    const queue = readQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.supplementId).toBe('sup1');
    expect(queue[0]?.supplementName).toBe('Vitamin D');
    expect(queue[0]?.source).toBe('notification');
    expect(queue[0]?.slot).toBe('morning');
  });

  it('adds multiple entries for multiple supplements', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [
      { id: 'sup1', name: 'Vitamin D' },
      { id: 'sup2', name: 'Magnesium' },
    ]));
    expect(readQueue()).toHaveLength(2);
  });

  it('deduplicates same supplement + slot + date', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }]));
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }]));
    expect(readQueue()).toHaveLength(1);
  });

  it('allows different slots for the same supplement on same day', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }], 'morning'));
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }], 'evening'));
    expect(readQueue()).toHaveLength(2);
  });
});

describe('flushPendingDoseLogs', () => {
  it('does nothing when queue is empty', async () => {
    await flushPendingDoseLogs('token');
    expect(mockLogDose).not.toHaveBeenCalled();
  });

  it('calls logDose for each queued entry', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [
      { id: 'sup1', name: 'Vitamin D' },
      { id: 'sup2', name: 'Magnesium' },
    ]));
    await flushPendingDoseLogs('tok');
    expect(mockLogDose).toHaveBeenCalledTimes(2);
    expect(readQueue()).toHaveLength(0);
  });

  it('keeps failed entries in queue for retry', async () => {
    mockLogDose.mockRejectedValueOnce(new Error('Network error'));
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }]));
    await flushPendingDoseLogs('tok');
    // Entry stays in queue since logDose threw
    expect(readQueue()).toHaveLength(1);
  });

  it('does nothing without a token', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }]));
    await flushPendingDoseLogs('');
    expect(mockLogDose).not.toHaveBeenCalled();
    expect(readQueue()).toHaveLength(1);
  });
});

describe('flushPendingDoseLogs — edge cases', () => {
  it('duplicate flush calls do not double-log — second flush is a no-op', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [{ id: 'sup1', name: 'Vitamin D' }]));
    await flushPendingDoseLogs('tok');
    expect(mockLogDose).toHaveBeenCalledTimes(1);
    expect(readQueue()).toHaveLength(0);
    // Second flush: queue already empty, logDose must not be called again
    await flushPendingDoseLogs('tok');
    expect(mockLogDose).toHaveBeenCalledTimes(1);
  });

  it('stale entry older than 24h is discarded without calling logDose', async () => {
    const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const staleEntry = {
      supplementId: 'sup1',
      supplementName: 'Vitamin D',
      slot: 'morning',
      takenAt: staleTime,
      source: 'notification' as const,
      dedupKey: `sup1:morning:${staleTime.slice(0, 10)}`,
    };
    store[PENDING_QUEUE_KEY] = JSON.stringify([staleEntry]);
    await flushPendingDoseLogs('tok');
    expect(mockLogDose).not.toHaveBeenCalled();
    expect(readQueue()).toHaveLength(0);
  });

  it('multiple queued supplements are all flushed and queue is cleared', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [
      { id: 'sup1', name: 'Vitamin D' },
      { id: 'sup2', name: 'Magnesium' },
      { id: 'sup3', name: 'Omega-3' },
    ]));
    await flushPendingDoseLogs('tok');
    expect(mockLogDose).toHaveBeenCalledTimes(3);
    expect(readQueue()).toHaveLength(0);
  });

  it('partial API failure — failed entry remains, succeeded entries are removed', async () => {
    await handleLogDoseResponse(makeResponse('TAKE', [
      { id: 'sup1', name: 'Vitamin D' },
      { id: 'sup2', name: 'Magnesium' },
      { id: 'sup3', name: 'Omega-3' },
    ]));
    // Second logDose call (for sup2) fails
    mockLogDose
      .mockResolvedValueOnce({ _id: 'log1' })
      .mockRejectedValueOnce(new Error('Network'))
      .mockResolvedValueOnce({ _id: 'log3' });
    await flushPendingDoseLogs('tok');
    expect(mockLogDose).toHaveBeenCalledTimes(3);
    const remaining = readQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.supplementId).toBe('sup2');
  });

  it('empty queue flush is a no-op — no API call, no error', async () => {
    await expect(flushPendingDoseLogs('tok')).resolves.toBeUndefined();
    expect(mockLogDose).not.toHaveBeenCalled();
  });
});
