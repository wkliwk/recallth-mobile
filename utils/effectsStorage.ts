import * as storage from '../services/storage';
import { weekKey } from './weekNumber';

export interface EffectRating {
  value: -2 | -1 | 0 | 1 | 2;
  note?: string;
  weekKey: string;
  recordedAt: string;
}

function ratingKey(supplementId: string, wk: string): string {
  return `effects_rating_${supplementId}_${wk}`;
}

function nextPromptKey(supplementId: string): string {
  return `effects_next_prompt_${supplementId}`;
}

export async function saveEffectRating(
  supplementId: string,
  value: EffectRating['value'],
  note?: string,
): Promise<void> {
  const wk = weekKey(new Date());
  const rating: EffectRating = {
    value,
    note: note?.trim() || undefined,
    weekKey: wk,
    recordedAt: new Date().toISOString(),
  };
  await storage.setItem(ratingKey(supplementId, wk), JSON.stringify(rating));
  // Schedule next prompt in 7 days
  const next = new Date();
  next.setDate(next.getDate() + 7);
  await storage.setItem(nextPromptKey(supplementId), next.toISOString().slice(0, 10));
}

export async function deferEffectPrompt(supplementId: string): Promise<void> {
  const next = new Date();
  next.setDate(next.getDate() + 3);
  await storage.setItem(nextPromptKey(supplementId), next.toISOString().slice(0, 10));
}

export async function isEffectPromptDue(supplementId: string, addedAt: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);

  // Must be at least 7 days after supplement was added
  const addedDate = new Date(addedAt);
  const minPromptDate = new Date(addedDate);
  minPromptDate.setDate(minPromptDate.getDate() + 7);
  if (today < minPromptDate.toISOString().slice(0, 10)) return false;

  const nextStr = await storage.getItem(nextPromptKey(supplementId)).catch(() => null);
  if (nextStr) {
    return today >= nextStr;
  }
  // Never been prompted — check if already rated this week
  const wk = weekKey(new Date());
  const existing = await storage.getItem(ratingKey(supplementId, wk)).catch(() => null);
  return !existing;
}

export async function getEffectRatings(supplementId: string): Promise<EffectRating[]> {
  // Scan last 26 weeks
  const ratings: EffectRating[] = [];
  const now = new Date();
  for (let i = 0; i < 26; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const wk = weekKey(d);
    const raw = await storage.getItem(ratingKey(supplementId, wk)).catch(() => null);
    if (raw) {
      try {
        ratings.unshift(JSON.parse(raw) as EffectRating);
      } catch { /* ignore */ }
    }
  }
  return ratings;
}
