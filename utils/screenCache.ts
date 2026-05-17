/**
 * Thin read/write wrapper over AsyncStorage for caching API responses.
 * Used by Home (today schedule) and Cabinet screens for offline support.
 */

import * as storage from '../services/storage';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
}

export async function readCache<T>(key: string): Promise<T | null> {
  const raw = await storage.getItem(key).catch(() => null);
  if (!raw) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, cachedAt: Date.now() };
  await storage.setItem(key, JSON.stringify(entry)).catch(() => {/* non-critical */});
}

export const CACHE_KEYS = {
  homeSchedule: 'recallth:cache:home-schedule',
  cabinet: 'recallth:cache:cabinet',
} as const;
