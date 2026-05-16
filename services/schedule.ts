import { api } from './api';

export interface DoseLogEntry {
  _id: string;
  supplementId: string;
  supplementName: string;
  slot: string;
  takenAt: string;
}

interface DoseLogResponse {
  success: boolean;
  data: DoseLogEntry;
}

export async function logDose(
  token: string,
  supplementId: string,
  supplementName: string,
  slot: string,
): Promise<DoseLogEntry> {
  const res = await api.post<DoseLogResponse>(
    '/schedule/log-dose',
    { supplementId, supplementName, slot, takenAt: new Date().toISOString() },
    { token },
  );
  return res.data;
}

export async function unlogDose(token: string, logId: string): Promise<void> {
  await api.delete(`/schedule/log-dose/${logId}`, { token });
}
