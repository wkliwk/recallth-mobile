import { api } from './api';

export interface SideEffectEntry {
  _id: string;
  cabinetItemId: string;
  symptom: string;
  rating: number;
  date: string;
  notes?: string;
}

interface SideEffectResponse {
  success: boolean;
  data: SideEffectEntry;
}

interface SideEffectsListResponse {
  success: boolean;
  data: SideEffectEntry[];
}

export async function logSideEffect(
  token: string,
  cabinetItemId: string,
  symptom: string,
  rating: number,
): Promise<SideEffectEntry> {
  const res = await api.post<SideEffectResponse>(
    '/side-effects',
    { cabinetItemId, symptom, rating },
    { token },
  );
  return res.data;
}

export async function getSideEffects(
  token: string,
  cabinetItemId?: string,
  limit = 20,
): Promise<SideEffectEntry[]> {
  const qs = new URLSearchParams({ limit: String(limit) });
  if (cabinetItemId) qs.set('cabinetItemId', cabinetItemId);
  const res = await api.get<SideEffectsListResponse>(`/side-effects?${qs.toString()}`, { token });
  return Array.isArray(res.data) ? res.data : [];
}
