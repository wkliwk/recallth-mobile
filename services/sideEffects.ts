import { api } from './api';

export interface SideEffectEntry {
  _id: string;
  cabinetItemId: string;
  symptom: string;
  severity: number;
  loggedAt: string;
}

interface SideEffectResponse {
  success: boolean;
  data: SideEffectEntry;
}

export async function logSideEffect(
  token: string,
  cabinetItemId: string,
  symptom: string,
  severity: number,
): Promise<SideEffectEntry> {
  const res = await api.post<SideEffectResponse>(
    '/side-effects',
    { cabinetItemId, symptom, severity, loggedAt: new Date().toISOString() },
    { token },
  );
  return res.data;
}
