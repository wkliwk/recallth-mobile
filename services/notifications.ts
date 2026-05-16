import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

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

/**
 * Schedule one repeating daily notification per HH:MM string.
 * Also schedules the weekly Sunday summary.
 * Cancels all existing notifications first.
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
