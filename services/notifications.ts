import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

export const SNOOZE_CATEGORY = 'DOSE_REMINDER_SNOOZE';
export const NUDGE_ID_PREFIX = 'nudge-';

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
  await ExpoNotifications.setNotificationCategoryAsync(SNOOZE_CATEGORY, [
    {
      identifier: 'SNOOZE',
      buttonTitle: 'Snooze 30 min',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
  ]);
}

export interface SupplementSchedule {
  time: string;
  supplements: string[];
  blockKey: string;
}

function buildNotificationBody(supplements: string[]): string {
  const names = supplements.slice(0, 3).join(' · ');
  return supplements.length > 3 ? `${names} + ${supplements.length - 3} more` : names;
}

export async function scheduleSmartReminders(
  schedules: SupplementSchedule[],
  missedNudgesEnabled = true,
): Promise<void> {
  await ExpoNotifications.cancelAllScheduledNotificationsAsync();

  for (const schedule of schedules) {
    if (schedule.supplements.length === 0) continue;
    const parts = schedule.time.split(':');
    const hour = parseInt(parts[0] ?? '9', 10);
    const minute = parseInt(parts[1] ?? '0', 10);
    if (isNaN(hour) || isNaN(minute)) continue;

    const body = buildNotificationBody(schedule.supplements);

    await ExpoNotifications.scheduleNotificationAsync({
      identifier: `dose-${schedule.blockKey}`,
      content: {
        title: 'Time for your dose 💊',
        body,
        data: { screen: 'home', block: schedule.blockKey },
        sound: true,
        categoryIdentifier: SNOOZE_CATEGORY,
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

// Schedule a repeating Sunday 09:00 adherence summary notification.
export async function scheduleWeeklySummary(): Promise<void> {
  await ExpoNotifications.scheduleNotificationAsync({
    content: {
      title: 'Recallth',
      body: 'Check in on your weekly supplement progress 💊',
      data: { screen: 'trends' },
      sound: true,
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
      weekday: 1, // Sunday (1=Sunday on iOS/Android)
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await ExpoNotifications.cancelAllScheduledNotificationsAsync();
}
