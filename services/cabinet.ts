/**
 * Cabinet API service — wraps /cabinet and /cabinet/interactions endpoints.
 *
 * Route docs: recallth-backend /src/routes/cabinet.ts + /src/routes/interactions.ts
 * Mount points: POST/GET/PUT/DELETE /cabinet, GET /cabinet/interactions
 */

import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupplementType = 'supplement' | 'medication' | 'vitamin';
export type SupplementSource = 'user_input' | 'ai_extracted';

/**
 * Status is derived client-side from backend fields:
 *   active: true              → 'active'
 *   active: false, no endDate → 'paused'
 *   active: false, endDate set → 'stopped'
 */
export type SupplementStatus = 'active' | 'paused' | 'stopped';

export interface ResearchNotes {
  summary: string;
  commonDosage: string;
  cautions: string;
  generatedAt: string;
}

export interface CabinetItem {
  _id: string;
  name: string;
  nameZh?: string;
  type: SupplementType;
  dosage?: string;
  frequency?: string;
  timing?: string;
  brand?: string;
  notes?: string;
  active: boolean;
  startDate: string;
  endDate?: string;
  source: SupplementSource;
  price?: number;
  currency?: string;
  description?: string;
  ingredients?: string;
  imageUrl?: string;
  researchNotes?: ResearchNotes;
  daysSupplyRemaining?: number;
  lowSupplyWarning?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  item1: string;
  item2: string;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  recommendation: string;
  citation: string;
}

export type CreateCabinetItemInput = {
  name: string;
  type: SupplementType;
  dosage?: string;
  frequency?: string;
  timing?: string;
  brand?: string;
  notes?: string;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  source?: SupplementSource;
};

export type UpdateCabinetItemInput = Partial<CreateCabinetItemInput>;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive display status from backend active + endDate fields. */
export function deriveStatus(item: Pick<CabinetItem, 'active' | 'endDate'>): SupplementStatus {
  if (item.active) return 'active';
  if (item.endDate) return 'stopped';
  return 'paused';
}

/** Map display status back to backend fields for PUT. */
export function statusToFields(status: SupplementStatus): { active: boolean; endDate?: string | null } {
  switch (status) {
    case 'active':
      return { active: true, endDate: null };
    case 'paused':
      return { active: false, endDate: null };
    case 'stopped':
      return { active: false, endDate: new Date().toISOString() };
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function listCabinetItems(token: string): Promise<CabinetItem[]> {
  const res = await api.get<ApiResponse<CabinetItem[]>>('/cabinet', { token });
  return res.data;
}

export async function listAllCabinetItems(token: string): Promise<CabinetItem[]> {
  const [activeRes, inactiveRes] = await Promise.all([
    api.get<ApiResponse<CabinetItem[]>>('/cabinet?active=true', { token }),
    api.get<ApiResponse<CabinetItem[]>>('/cabinet?active=false', { token }),
  ]);
  return [...(activeRes.data ?? []), ...(inactiveRes.data ?? [])];
}

export async function createCabinetItem(
  input: CreateCabinetItemInput,
  token: string,
): Promise<CabinetItem> {
  const res = await api.post<ApiResponse<CabinetItem>>('/cabinet', input, { token });
  return res.data;
}

export async function updateCabinetItem(
  id: string,
  input: UpdateCabinetItemInput,
  token: string,
): Promise<CabinetItem> {
  const res = await api.put<ApiResponse<CabinetItem>>(`/cabinet/${id}`, input, { token });
  return res.data;
}

export async function deleteCabinetItem(id: string, token: string): Promise<void> {
  await api.delete<ApiResponse<null>>(`/cabinet/${id}`, { token });
}

export async function getInteractions(token: string): Promise<Interaction[]> {
  const res = await api.get<ApiResponse<{ interactions: Interaction[] }>>('/cabinet/interactions', {
    token,
  });
  return res.data?.interactions ?? [];
}
