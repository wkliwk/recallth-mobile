import * as storage from '../services/storage';
import * as ExpoNotifications from 'expo-notifications';

const KEY_PREFIX = 'recallth:reminder-time:';

export function reminderKey(supplementId: string): string {
  return `${KEY_PREFIX}${supplementId}`;
}

export async function getReminderTime(supplementId: string): Promise<string | null> {
  return storage.getItem(reminderKey(supplementId)).catch(() => null);
}

export async function setReminderTime(supplementId: string, hhmm: string): Promise<void> {
  await storage.setItem(reminderKey(supplementId), hhmm);
}

export async function clearReminderTime(supplementId: string): Promise<void> {
  await storage.deleteItem(reminderKey(supplementId)).catch(() => {/* non-critical */});
}

export function formatReminderTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === undefined || m === undefined) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

const SUPP_NOTIF_PREFIX = 'supp-reminder-';

export function suppNotifId(supplementId: string): string {
  return `${SUPP_NOTIF_PREFIX}${supplementId}`;
}

export async function scheduleSupplementReminder(
  supplementId: string,
  supplementName: string,
  hhmm: string,
): Promise<void> {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === undefined || m === undefined || isNaN(h) || isNaN(m)) return;

  await ExpoNotifications.cancelScheduledNotificationAsync(suppNotifId(supplementId)).catch(() => {});
  await ExpoNotifications.scheduleNotificationAsync({
    identifier: suppNotifId(supplementId),
    content: {
      title: 'Time for your dose 💊',
      body: `${supplementName} — tap to log your dose`,
      data: { screen: 'home', supplementId },
      sound: true,
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      hour: h,
      minute: m,
    },
  });
}

export async function cancelSupplementReminder(supplementId: string): Promise<void> {
  await ExpoNotifications.cancelScheduledNotificationAsync(suppNotifId(supplementId)).catch(() => {});
  await clearReminderTime(supplementId);
}
