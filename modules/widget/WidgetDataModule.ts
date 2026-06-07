import { NativeModules, Platform } from 'react-native';

export interface WidgetData {
  dosesTaken: number;
  dosesTotal: number;
  streak: number;
  nextDoseName: string;
  nextDoseTime: string;
  isLoggedIn: boolean;
  date: string;
}

const MODULE_KEY = 'RecallthWidget';

function getNativeModule(): { setWidgetData: (data: string) => void } | null {
  const mod = NativeModules[MODULE_KEY] as
    | { setWidgetData: (data: string) => void }
    | undefined;
  return mod ?? null;
}

export function setWidgetData(data: WidgetData): void {
  const mod = getNativeModule();
  if (!mod) return;
  try {
    mod.setWidgetData(JSON.stringify(data));
  } catch {
    // Never crash the app over widget data
  }
}

export function reloadWidget(): void {
  if (Platform.OS !== 'ios') return;
  const mod = getNativeModule();
  if (!mod) return;
  try {
    (mod as unknown as { reloadTimeline: () => void }).reloadTimeline?.();
  } catch {
    // no-op
  }
}
