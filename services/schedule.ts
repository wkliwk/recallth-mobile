import { api } from './api';

export interface DoseLogEntry {
  _id: string;
  supplementId: string;
  supplementName: string;
  slot: string;
  takenAt: string;
  late?: boolean;
  notes?: string;
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
  late = false,
  notes?: string,
): Promise<DoseLogEntry> {
  const body: Record<string, unknown> = { supplementId, supplementName, slot, takenAt: new Date().toISOString(), late };
  if (notes?.trim()) body.notes = notes.trim();
  const res = await api.post<DoseLogResponse>('/schedule/log-dose', body, { token });
  return res.data;
}

export async function unlogDose(token: string, logId: string): Promise<void> {
  await api.delete(`/schedule/log-dose/${logId}`, { token });
}

interface DoseLogsResponse {
  success: boolean;
  data: DoseLogEntry[];
}

export async function getTodayDoseLogs(token: string): Promise<DoseLogEntry[]> {
  const today = new Date().toISOString().slice(0, 10);
  const res = await api.get<DoseLogsResponse>(
    `/schedule/dose-logs?from=${today}&to=${today}`,
    { token },
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function getDoseLogsRange(
  token: string,
  from: string,
  to: string,
): Promise<DoseLogEntry[]> {
  const res = await api.get<DoseLogsResponse>(
    `/schedule/dose-logs?from=${from}&to=${to}`,
    { token },
  );
  return Array.isArray(res.data) ? res.data : [];
}
