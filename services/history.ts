/**
 * History service — calls GET /history/timeline (merged paginated timeline).
 *
 * Backend shape (from wkliwk/recallth-backend src/routes/history.ts):
 *   GET /history/timeline?page=1&limit=20
 *   Response: { success, data: { data: TimelineEntry[], total, page, limit, hasMore } }
 */

import { api } from './api';

// ─── Types ────────────────────────────────────────────────────────────────

export type TimelineEntryType = 'conversation' | 'profile_change' | 'cabinet_change';

export interface ConversationData {
  _id: string;
  title: string | null;
  createdAt: string;
  messageCount: number;
  firstMessage: string | null;
}

export interface ProfileChangeData {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: string;
  source?: string;
}

export interface CabinetChangeData {
  _id: string;
  userId: string;
  itemName: string;
  action: string;
  timestamp: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface ConversationEntry {
  type: 'conversation';
  timestamp: string;
  summary: string;
  data: ConversationData;
}

export interface ProfileChangeEntry {
  type: 'profile_change';
  timestamp: string;
  summary: string;
  data: ProfileChangeData;
}

export interface CabinetChangeEntry {
  type: 'cabinet_change';
  timestamp: string;
  summary: string;
  data: CabinetChangeData;
}

export type TimelineEntry = ConversationEntry | ProfileChangeEntry | CabinetChangeEntry;

export interface TimelineResponse {
  data: TimelineEntry[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  error: string | null;
  data: T;
}

// ─── API call ─────────────────────────────────────────────────────────────

export async function fetchTimeline(
  token: string,
  page = 1,
  limit = 20,
): Promise<TimelineResponse> {
  const resp = await api.get<ApiResponse<TimelineResponse>>(
    `/history/timeline?page=${page}&limit=${limit}`,
    { token },
  );
  return resp.data;
}
