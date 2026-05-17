/**
 * Unit tests for scheduleWeeklySummaryNotification logic.
 * We test the adherence/streak/best-day computation in isolation by mocking dependencies.
 */

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

import * as ExpoNotifications from 'expo-notifications';
import { getDoseLogsRange } from '../../services/schedule';
import { getStreak } from '../../services/intake';
import { scheduleWeeklySummaryNotification, WEEKLY_SUMMARY_ID } from '../../services/notifications';

jest.mock('expo-notifications', () => ({
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('id'),
  SchedulableTriggerInputTypes: { CALENDAR: 'calendar' },
}));

jest.mock('../../services/schedule', () => ({
  getDoseLogsRange: jest.fn(),
}));

jest.mock('../../services/intake', () => ({
  getStreak: jest.fn(),
}));

const mockGetDoseLogsRange = getDoseLogsRange as jest.MockedFunction<typeof getDoseLogsRange>;
const mockGetStreak = getStreak as jest.MockedFunction<typeof getStreak>;
const mockSchedule = ExpoNotifications.scheduleNotificationAsync as jest.MockedFunction<
  typeof ExpoNotifications.scheduleNotificationAsync
>;
const mockCancel = ExpoNotifications.cancelScheduledNotificationAsync as jest.MockedFunction<
  typeof ExpoNotifications.cancelScheduledNotificationAsync
>;

function makeLog(takenAt: string) {
  return {
    _id: 'id',
    supplementId: 'sup1',
    supplementName: 'Vitamin D',
    slot: 'morning',
    takenAt,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetStreak.mockResolvedValue({ currentStreak: 5, longestStreak: 10, lastLoggedDate: '2026-05-16' });
  mockGetDoseLogsRange.mockResolvedValue([]);
});

test('cancels existing notification and does not reschedule when disabled', async () => {
  await scheduleWeeklySummaryNotification('tok', false, true);
  expect(mockCancel).toHaveBeenCalledWith(WEEKLY_SUMMARY_ID);
  expect(mockSchedule).not.toHaveBeenCalled();
});

test('cancels and does not reschedule when hasCabinetItems is false', async () => {
  await scheduleWeeklySummaryNotification('tok', true, false);
  expect(mockCancel).toHaveBeenCalledWith(WEEKLY_SUMMARY_ID);
  expect(mockSchedule).not.toHaveBeenCalled();
});

test('schedules notification with 0% adherence when no logs', async () => {
  mockGetDoseLogsRange.mockResolvedValue([]);
  await scheduleWeeklySummaryNotification('tok', true, true);
  expect(mockSchedule).toHaveBeenCalledTimes(1);
  const call = mockSchedule.mock.calls[0]![0];
  expect(call.identifier).toBe(WEEKLY_SUMMARY_ID);
  expect(call.content.body).toContain('0% adherence this week');
  expect(call.content.body).toContain('5-day streak');
});

test('computes correct adherence percentage', async () => {
  // 5 unique days out of 7
  mockGetDoseLogsRange.mockResolvedValue([
    makeLog('2026-05-11T09:00:00.000Z'),
    makeLog('2026-05-12T09:00:00.000Z'),
    makeLog('2026-05-13T09:00:00.000Z'),
    makeLog('2026-05-14T09:00:00.000Z'),
    makeLog('2026-05-15T09:00:00.000Z'),
  ]);
  await scheduleWeeklySummaryNotification('tok', true, true);
  const body = (mockSchedule.mock.calls[0]![0].content.body as string);
  expect(body).toContain('71% adherence this week');
});

test('includes best day in body when logs exist', async () => {
  // Saturday 2026-05-16 has 3 logs, others have 1
  mockGetDoseLogsRange.mockResolvedValue([
    makeLog('2026-05-16T07:00:00.000Z'),
    makeLog('2026-05-16T12:00:00.000Z'),
    makeLog('2026-05-16T18:00:00.000Z'),
    makeLog('2026-05-15T09:00:00.000Z'),
  ]);
  await scheduleWeeklySummaryNotification('tok', true, true);
  const body = (mockSchedule.mock.calls[0]![0].content.body as string);
  expect(body).toContain('Best day: Saturday');
});

test('schedules on weekday 1 (Sunday) at 19:00 repeating', async () => {
  await scheduleWeeklySummaryNotification('tok', true, true);
  const trigger = mockSchedule.mock.calls[0]![0].trigger as Record<string, unknown>;
  expect(trigger.weekday).toBe(1);
  expect(trigger.hour).toBe(19);
  expect(trigger.minute).toBe(0);
  expect(trigger.repeats).toBe(true);
});

test('notification taps deep-link to trends screen', async () => {
  await scheduleWeeklySummaryNotification('tok', true, true);
  expect(mockSchedule.mock.calls[0]![0].content.data).toEqual({ screen: 'trends' });
});
