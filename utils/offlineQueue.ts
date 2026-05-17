/**
 * Offline dose-log queue.
 *
 * When the device is offline, logDose calls are queued here.
 * Call drainOfflineQueue() when connectivity is restored to replay them.
 */

import * as storage from '../services/storage';
import { logDose } from '../services/schedule';

const QUEUE_KEY = 'recallth:offline-dose-queue';

export interface QueuedDoseLog {
  supplementId: string;
  supplementName: string;
  slot: string;
  takenAt: string;
  notes?: string;
}

export async function enqueueOfflineDoseLog(entry: QueuedDoseLog): Promise<void> {
  const raw = await storage.getItem(QUEUE_KEY).catch(() => null);
  const queue: QueuedDoseLog[] = raw ? (JSON.parse(raw) as QueuedDoseLog[]) : [];
  queue.push(entry);
  await storage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getOfflineQueue(): Promise<QueuedDoseLog[]> {
  const raw = await storage.getItem(QUEUE_KEY).catch(() => null);
  return raw ? (JSON.parse(raw) as QueuedDoseLog[]) : [];
}

export async function clearOfflineQueue(): Promise<void> {
  await storage.deleteItem(QUEUE_KEY).catch(() => {/* non-critical */});
}

/**
 * Replay all queued dose logs against the live API.
 * Clears the queue on success; leaves it intact on partial failure so items
 * aren't lost (they'll be retried on the next drain call).
 */
export async function drainOfflineQueue(token: string): Promise<number> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return 0;

  const failed: QueuedDoseLog[] = [];
  for (const entry of queue) {
    try {
      await logDose(token, entry.supplementId, entry.supplementName, entry.slot, false, entry.notes, entry.takenAt);
    } catch {
      failed.push(entry);
    }
  }

  if (failed.length === 0) {
    await clearOfflineQueue();
  } else {
    await storage.setItem(QUEUE_KEY, JSON.stringify(failed));
  }

  return queue.length - failed.length;
}
