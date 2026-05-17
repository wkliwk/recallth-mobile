import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getDoseLogsRange, logDose } from './schedule';
import { getStreak } from './intake';
import { getItem, setItem, deleteItem } from './storage';
import { getNotificationCopy } from '../utils/notificationCopy';

export const SNOOZE_CATEGORY = 'DOSE_REMINDER_SNOOZE';
export const LOG_DOSE_CATEGORY = 'LOG_DOSE';
export const NUDGE_ID_PREFIX = 'nudge-';
export const WEEKLY_SUMMARY_ID = 'recallth-weekly-summary';

const PENDING_DOSE_KEY_PREFIX = 'recallth:pending-dose-log:';

// Configure foreground notification behavior once (call from root layout).
export function configureNotificationHandler(): void {
  ExpoNotifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestPermissions(): Promise<'granted' | 'denied' | 'undetermined'> {
  if (Platform.OS === 'android') {
    // Android 13+ requires POST_NOTIFICATIONS permission — expo-notifications handles this.
  }
  const { status: existing } = await ExpoNotifications.getPermissionsAsync();
  if (existing === 'granted') return 'granted';
  const { status } = await ExpoNotifications.requestPermissionsAsync();
  return status;
}

export async function registerNotificationCategories(): Promise<void> {
  await Promise.all([
    ExpoNotifications.setNotificationCategoryAsync(SNOOZE_CATEGORY, [
      {
        identifier: 'SNOOZE',
        buttonTitle: 'Snooze 30 min',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
    ]),
    ExpoNotifications.setNotificationCategoryAsync(LOG_DOSE_CATEGORY, [
      {
        identifier: 'TAKE',
        buttonTitle: 'Taken',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
      {
        identifier: 'SNOOZE',
        buttonTitle: 'Snooze 30 min',
        options: { isDestructive: false, isAuthenticationRequired: false },
      },
    ]),
  ]);
}

export interface SupplementSchedule {
  time: string;
  supplements: string[];
  blockKey: string;
  /** supplement IDs (optional) — used for LOG_DOSE notification action */
  supplementIds?: { id: string; name: string }[];
}

function buildNotificationBody(supplements: string[]): string {
  const names = supplements.slice(0, 3).join(' · ');
  return supplements.length > 3 ? `${names} + ${supplements.length - 3} more` : names;
}

export interface StreakContext {
  streak: number;
  freezeActive: boolean;
  missedYesterday: boolean;
}

export async function scheduleSmartReminders(
  schedules: SupplementSchedule[],
  missedNudgesEnabled = true,
  streakCtx?: StreakContext,
): Promise<void> {
  await ExpoNotifications.cancelAllScheduledNotificationsAsync();

  for (const schedule of schedules) {
    if (schedule.supplements.length === 0) continue;
    const parts = schedule.time.split(':');
    const hour = parseInt(parts[0] ?? '9', 10);
    const minute = parseInt(parts[1] ?? '0', 10);
    if (isNaN(hour) || isNaN(minute)) continue;

    const body = streakCtx
      ? getNotificationCopy({
          streak: streakCtx.streak,
          supplements: schedule.supplements,
          notificationHour: hour,
          freezeActive: streakCtx.freezeActive,
          missedYesterday: streakCtx.missedYesterday,
        })
      : buildNotificationBody(schedule.supplements);

    const hasSupplementIds = (schedule.supplementIds?.length ?? 0) > 0;
    await ExpoNotifications.scheduleNotificationAsync({
      identifier: `dose-${schedule.blockKey}`,
      content: {
        title: 'Time for your dose 💊',
        body,
        data: {
          screen: 'home',
          block: schedule.blockKey,
          supplementIds: schedule.supplementIds ?? [],
          slot: schedule.blockKey,
        },
        sound: true,
        categoryIdentifier: hasSupplementIds ? LOG_DOSE_CATEGORY : SNOOZE_CATEGORY,
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        hour,
        minute,
      },
    });

    if (missedNudgesEnabled) {
      const nudgeHour = (hour + 2) % 24;
      await ExpoNotifications.scheduleNotificationAsync({
        identifier: `${NUDGE_ID_PREFIX}${schedule.blockKey}`,
        content: {
          title: 'Still not logged 💊',
          body: `Haven't logged your ${schedule.blockKey} doses yet — ${body}`,
          data: { screen: 'home', block: schedule.blockKey, nudge: true },
          sound: true,
        },
        trigger: {
          type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
          repeats: true,
          hour: nudgeHour,
          minute,
        },
      });
    }
  }

  await scheduleWeeklySummary();
}

export interface PendingDoseLog {
  supplementId: string;
  supplementName: string;
  slot: string;
  takenAt: string;
  source: 'notification';
  dedupKey: string;
}

const PENDING_QUEUE_KEY = `${PENDING_DOSE_KEY_PREFIX}queue`;

async function readPendingQueue(): Promise<PendingDoseLog[]> {
  const raw = await getItem(PENDING_QUEUE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as PendingDoseLog[]; } catch { return []; }
}

async function writePendingQueue(queue: PendingDoseLog[]): Promise<void> {
  await setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Handles the LOG_DOSE category "Taken" action.
 * Appends pending dose entries to a queue in AsyncStorage.
 * Deduplicates by supplementId + slot + date — won't add if already in queue.
 */
export async function handleLogDoseResponse(
  response: ExpoNotifications.NotificationResponse,
): Promise<void> {
  if (response.actionIdentifier !== 'TAKE') return;

  const data = response.notification.request.content.data as Record<string, unknown>;
  const slot = (data.slot as string | undefined) ?? 'unknown';
  const supplementIds = (data.supplementIds as { id: string; name: string }[] | undefined) ?? [];

  if (supplementIds.length === 0) return;

  const takenAt = new Date().toISOString();
  const dateStr = takenAt.slice(0, 10);
  const queue = await readPendingQueue();

  const existingKeys = new Set(queue.map((e) => e.dedupKey));
  const newEntries: PendingDoseLog[] = [];

  for (const { id, name } of supplementIds) {
    const dedupKey = `${id}:${slot}:${dateStr}`;
    if (!existingKeys.has(dedupKey)) {
      newEntries.push({ supplementId: id, supplementName: name, slot, takenAt, source: 'notification', dedupKey });
    }
  }

  if (newEntries.length > 0) {
    await writePendingQueue([...queue, ...newEntries]);
  }
}

/**
 * Flush pending dose logs to the API. Call on app foreground.
 * Successfully submitted entries are removed from the queue.
 */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export async function flushPendingDoseLogs(token: string): Promise<void> {
  if (!token) return;
  const queue = await readPendingQueue();
  if (queue.length === 0) return;

  const now = Date.now();
  const fresh = queue.filter((e) => now - new Date(e.takenAt).getTime() < STALE_THRESHOLD_MS);

  if (fresh.length === 0) {
    await writePendingQueue([]);
    return;
  }

  const remaining: PendingDoseLog[] = [];
  await Promise.allSettled(
    fresh.map(async (entry) => {
      try {
        await logDose(token, entry.supplementId, entry.supplementName, entry.slot, false, undefined, entry.takenAt);
      } catch {
        remaining.push(entry);
      }
    }),
  );

  await writePendingQueue(remaining);
}

export async function cancelNudgesForBlocks(loggedBlocks: string[]): Promise<void> {
  await Promise.allSettled(
    loggedBlocks.map((block) =>
      ExpoNotifications.cancelScheduledNotificationAsync(`${NUDGE_ID_PREFIX}${block}`),
    ),
  );
}

export async function handleSnoozeResponse(
  response: ExpoNotifications.NotificationResponse,
): Promise<void> {
  if (response.actionIdentifier !== 'SNOOZE') return;

  const data = response.notification.request.content.data as Record<string, unknown>;
  const block = data.block as string | undefined;
  if (!block) return;

  const snoozeDate = new Date();
  snoozeDate.setMinutes(snoozeDate.getMinutes() + 30);

  const orig = response.notification.request.content;
  await ExpoNotifications.scheduleNotificationAsync({
    identifier: `dose-${block}-snoozed`,
    content: {
      title: orig.title ?? 'Time for your dose 💊',
      body: orig.body ?? undefined,
      data: orig.data,
      sound: true,
      categoryIdentifier: SNOOZE_CATEGORY,
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.DATE,
      date: snoozeDate,
    },
  });
}

/**
 * Legacy wrapper — keeps existing callers in settings.tsx working.
 * Schedules generic (non-supplement-named) notifications.
 */
export async function scheduleDailyReminders(times: string[]): Promise<void> {
  await ExpoNotifications.cancelAllScheduledNotificationsAsync();

  for (const timeStr of times) {
    const parts = timeStr.split(':');
    const hour = parseInt(parts[0] ?? '9', 10);
    const minute = parseInt(parts[1] ?? '0', 10);
    if (isNaN(hour) || isNaN(minute)) continue;

    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: 'Recallth',
        body: 'Time to log your supplements 💊',
        data: { screen: 'home' },
        sound: true,
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
        repeats: true,
        hour,
        minute,
      },
    });
  }

  await scheduleWeeklySummary();
}

// No-op kept for call-site compat; weekly summary is managed via scheduleWeeklySummaryNotification.
async function scheduleWeeklySummary(): Promise<void> { /* no-op */ }

export async function cancelAllReminders(): Promise<void> {
  await ExpoNotifications.cancelAllScheduledNotificationsAsync();
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Schedule (or cancel) the weekly Sunday 7 PM adherence summary notification.
 * Body is assembled from the last 7 days of dose log data.
 * Call whenever the toggle changes in Settings and after smart reminders are scheduled on app load.
 */
export async function scheduleWeeklySummaryNotification(
  token: string,
  enabled: boolean,
  hasCabinetItems: boolean,
): Promise<void> {
  await ExpoNotifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID).catch(() => {});

  if (!enabled || !hasCabinetItems) return;

  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 6);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = today.toISOString().slice(0, 10);

  const [doseLogs, streak] = await Promise.all([
    getDoseLogsRange(token, fromStr, toStr).catch(() => []),
    getStreak(token).catch(() => ({ currentStreak: 0, longestStreak: 0, lastLoggedDate: null })),
  ]);

  const loggedDays = new Set(doseLogs.map((l) => l.takenAt.slice(0, 10)));
  const adherencePct = Math.round((loggedDays.size / 7) * 100);

  const countsByDay = new Array<number>(7).fill(0);
  for (const log of doseLogs) {
    countsByDay[new Date(log.takenAt).getDay()]++;
  }
  const maxCount = Math.max(...countsByDay);
  const bestDay = maxCount > 0 ? DAY_NAMES[countsByDay.indexOf(maxCount)] : null;

  const parts: string[] = [
    `${adherencePct}% adherence this week`,
    `${streak.currentStreak}-day streak`,
  ];
  if (bestDay) parts.push(`Best day: ${bestDay}`);

  await ExpoNotifications.scheduleNotificationAsync({
    identifier: WEEKLY_SUMMARY_ID,
    content: {
      title: 'Your weekly supplement summary',
      body: parts.join(' · '),
      data: { screen: 'trends' },
      sound: true,
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 1,
      hour: 19,
      minute: 0,
      repeats: true,
    },
  });
}
