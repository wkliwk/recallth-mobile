import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { listCabinetItems, createCabinetItem, type CabinetItem } from './cabinet';
import { getDoseLogsRange, logDose, type DoseLogEntry } from './schedule';
import { getStreak } from './intake';

interface BackupPayload {
  version: 1;
  exportedAt: string;
  cabinetItems: CabinetItem[];
  doseLogs: DoseLogEntry[];
  streak: number;
}

export async function backupData(token: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [cabinetItems, doseLogs, streakData] = await Promise.all([
    listCabinetItems(token),
    getDoseLogsRange(token, ninetyDaysAgo, today),
    getStreak(token).catch(() => ({ currentStreak: 0 })),
  ]);

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cabinetItems,
    doseLogs,
    streak: streakData.currentStreak,
  };

  const json = JSON.stringify(payload, null, 2);
  const fileName = `recallth-backup-${today}.json`;
  const fileUri = `${FileSystem.cacheDirectory ?? ''}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Recallth Backup',
    UTI: 'public.json',
  });
}

export type RestoreResult = 'ok' | 'invalid' | 'cancelled';

export async function restoreData(token: string): Promise<RestoreResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'public.json'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return 'cancelled';

  const asset = result.assets[0];
  if (!asset?.uri) return 'invalid';

  let raw: string;
  try {
    raw = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch {
    return 'invalid';
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return 'invalid';
  }

  if (!isValidBackup(payload)) return 'invalid';

  const backup = payload as BackupPayload;

  // Restore cabinet items — additive only (match by name, case-insensitive)
  const existing = await listCabinetItems(token);
  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
  await Promise.allSettled(
    backup.cabinetItems.map((item) => {
      if (existingNames.has(item.name.toLowerCase())) return Promise.resolve();
      return createCabinetItem(
        {
          name: item.name,
          type: item.type,
          dosage: item.dosage,
          frequency: item.frequency,
          timing: item.timing,
          brand: item.brand,
          notes: item.notes,
          purpose: item.purpose,
          active: item.active,
          startDate: item.startDate,
          endDate: item.endDate,
          source: 'user_input',
        },
        token,
      );
    }),
  );

  // Restore dose logs — re-log entries using backfill flag; server handles dedup
  await Promise.allSettled(
    backup.doseLogs.map((log) =>
      logDose(
        token,
        log.supplementId,
        log.supplementName,
        log.slot,
        false,
        log.notes,
        log.takenAt,
        true,
      ),
    ),
  );

  return 'ok';
}

function isValidBackup(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    d.version === 1 &&
    typeof d.exportedAt === 'string' &&
    Array.isArray(d.cabinetItems) &&
    Array.isArray(d.doseLogs)
  );
}
