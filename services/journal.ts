import { api } from './api';

export interface JournalEntry {
  _id: string;
  date: string;
  mood: number;
  energy: number;
  notes?: string;
}

interface JournalResponse {
  success: boolean;
  data: JournalEntry;
}

interface JournalListResponse {
  success: boolean;
  data: JournalEntry[];
}

export async function logJournal(
  token: string,
  mood: number,
  energy: number,
  notes?: string,
): Promise<JournalEntry> {
  const body: { mood: number; energy: number; notes?: string } = { mood, energy };
  if (notes && notes.trim()) body.notes = notes.trim();
  const res = await api.post<JournalResponse>('/journal', body, { token });
  return res.data;
}

export async function getTodayJournal(token: string): Promise<JournalEntry | null> {
  const res = await api.get<JournalListResponse>('/journal?days=1', { token });
  const entries = Array.isArray(res.data) ? res.data : [];
  const today = new Date().toISOString().slice(0, 10);
  return entries.find((e) => e.date === today) ?? null;
}

export async function getJournalEntries(token: string, days = 7): Promise<JournalEntry[]> {
  const res = await api.get<JournalListResponse>(`/journal?days=${days}`, { token });
  return Array.isArray(res.data) ? res.data : [];
}
