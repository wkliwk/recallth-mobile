import { api, apiRequest } from './api';

export type DigestDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface UserSettings {
  remindersEnabled: boolean;
  reminderTimes: string[];
  timezone: string;
  emailDigestEnabled: boolean;
  emailDigestDay: DigestDay;
}

export async function getSettings(token: string): Promise<UserSettings> {
  return api.get<UserSettings>('/settings', { token });
}

export async function patchSettings(token: string, update: Partial<UserSettings>): Promise<void> {
  await apiRequest('/settings', { method: 'PATCH', body: update, token });
}
