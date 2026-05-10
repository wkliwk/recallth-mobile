import { api } from './api';
import { Goal, Sex } from '../stores/onboarding';

export type ProfileSeedPayload = {
  height_cm?: number;
  weight_kg?: number;
  sex?: Exclude<Sex, null>;
  age?: number;
  primary_goal?: Exclude<Goal, null>;
};

export type SupplementSeedItem = {
  name: string;
};

/**
 * Persist body stats + goal to the backend /profile endpoint.
 * All fields are optional — partial save is acceptable (user may have skipped).
 */
export async function seedProfile(
  payload: ProfileSeedPayload,
  token: string,
): Promise<void> {
  // Only send fields that were actually filled in
  const body: Record<string, unknown> = {};
  if (payload.height_cm !== undefined) body.height_cm = payload.height_cm;
  if (payload.weight_kg !== undefined) body.weight_kg = payload.weight_kg;
  if (payload.sex !== undefined) body.sex = payload.sex;
  if (payload.age !== undefined) body.age = payload.age;
  if (payload.primary_goal !== undefined) body.primary_goal = payload.primary_goal;

  if (Object.keys(body).length === 0) return;

  await api.put('/profile', body, { token });
}

/**
 * Persist a single cabinet supplement to /supplements.
 */
export async function seedSupplement(
  item: SupplementSeedItem,
  token: string,
): Promise<void> {
  await api.post('/supplements', { name: item.name }, { token });
}

/**
 * Persist all cabinet items to /supplements.
 * Silently continues if individual saves fail — partial seeding is OK.
 */
export async function seedSupplements(
  items: string[],
  token: string,
): Promise<void> {
  const nonEmpty = items.filter((i) => i.trim().length > 0);
  await Promise.allSettled(
    nonEmpty.map((name) => seedSupplement({ name: name.trim() }, token)),
  );
}
