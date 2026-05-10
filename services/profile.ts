/**
 * Profile service — wraps GET/PUT /profile and GET /weight-log
 * from the Recallth backend.
 */

import { api } from './api';

// ─── Provenance ───────────────────────────────────────────────────────────────

export type Provenance = 'ai_extracted' | 'user_edited' | 'needs_review';

// ─── Field shapes ─────────────────────────────────────────────────────────────

export type ProfileFieldValue = string | number | boolean | null;

export interface ProfileField {
  value: ProfileFieldValue;
  provenance: Provenance;
}

// ─── Section shapes ───────────────────────────────────────────────────────────

export interface BodySection {
  age: ProfileField;
  sex: ProfileField;
  height_cm: ProfileField;
  weight_kg: ProfileField;
  bmi: ProfileField;
}

export interface ConditionsSection {
  conditions: ProfileField;
  allergies: ProfileField;
  medications: ProfileField;
}

export interface LifestyleSection {
  diet: ProfileField;
  activity_level: ProfileField;
  sleep_hours: ProfileField;
  alcohol: ProfileField;
  smoking: ProfileField;
}

export interface GoalsSection {
  primary_goal: ProfileField;
  secondary_goals: ProfileField;
  concerns: ProfileField;
}

// ─── Top-level profile ────────────────────────────────────────────────────────

export interface HealthProfile {
  body: BodySection;
  conditions: ConditionsSection;
  lifestyle: LifestyleSection;
  goals: GoalsSection;
}

// ─── Weight log ───────────────────────────────────────────────────────────────

export interface WeightEntry {
  date: string; // ISO 8601
  weight_kg: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function fetchProfile(token: string): Promise<HealthProfile> {
  return api.get<HealthProfile>('/profile', { token });
}

export async function updateProfile(
  token: string,
  data: Partial<HealthProfile>,
): Promise<HealthProfile> {
  return api.put<HealthProfile>('/profile', data, { token });
}

export async function fetchWeightLog(
  token: string,
  limit = 30,
): Promise<WeightEntry[]> {
  return api.get<WeightEntry[]>(`/profile/weight-log?limit=${limit}`, { token });
}

// ─── Completeness helpers ─────────────────────────────────────────────────────

/**
 * Returns a 0–100 integer representing what fraction of tracked fields
 * have a non-null value.
 */
export function computeCompleteness(profile: HealthProfile): number {
  const fields: ProfileFieldValue[] = [
    profile.body.age.value,
    profile.body.sex.value,
    profile.body.height_cm.value,
    profile.body.weight_kg.value,
    profile.conditions.conditions.value,
    profile.conditions.allergies.value,
    profile.conditions.medications.value,
    profile.lifestyle.diet.value,
    profile.lifestyle.activity_level.value,
    profile.lifestyle.sleep_hours.value,
    profile.goals.primary_goal.value,
    profile.goals.secondary_goals.value,
  ];
  const filled = fields.filter(
    (v) => v !== null && v !== '' && v !== undefined,
  ).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Returns an empty HealthProfile skeleton for initial/fallback state.
 */
export function emptyProfile(): HealthProfile {
  const empty = (): ProfileField => ({ value: null, provenance: 'needs_review' });
  return {
    body: {
      age: empty(),
      sex: empty(),
      height_cm: empty(),
      weight_kg: empty(),
      bmi: empty(),
    },
    conditions: {
      conditions: empty(),
      allergies: empty(),
      medications: empty(),
    },
    lifestyle: {
      diet: empty(),
      activity_level: empty(),
      sleep_hours: empty(),
      alcohol: empty(),
      smoking: empty(),
    },
    goals: {
      primary_goal: empty(),
      secondary_goals: empty(),
      concerns: empty(),
    },
  };
}
