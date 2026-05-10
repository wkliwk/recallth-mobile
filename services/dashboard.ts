/**
 * Dashboard service — fetches data needed for the Home screen.
 *
 * Route map (confirmed from recallth-backend src/index.ts):
 *   GET /history/conversations?limit=3  → recent conversations
 *   GET /cabinet/interactions           → pairwise interaction check
 *   GET /cabinet?limit=1               → cabinet item count (active items)
 *   GET /profile                       → profile completeness (used for Profile % stat)
 *
 * TODO: backend does not yet expose a single /dashboard summary endpoint.
 * These four calls are made individually. A backend /dashboard route can be
 * added in a follow-up issue to reduce round trips.
 */

import { api, ApiError } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Conversation = {
  _id: string;
  title: string | null;
  createdAt: string;
  messageCount: number;
  firstMessage: string | null;
};

export type Interaction = {
  severity: 'safe' | 'moderate' | 'major';
  item1: string;
  item2: string;
  description?: string;
};

export type DashboardStats = {
  /** Number of active cabinet items. */
  cabinetCount: number;
  /** Number of pending interaction alerts (severity >= moderate). */
  alertCount: number;
  /** Profile completeness 0–100. */
  profilePct: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentConversations: Conversation[];
  interactions: Interaction[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isModeratePlus(severity: string): boolean {
  return severity === 'moderate' || severity === 'major';
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchRecentConversations(token: string): Promise<Conversation[]> {
  try {
    type ConversationsResponse = {
      success: boolean;
      data: { conversations: Conversation[] };
    };
    const res = await api.get<ConversationsResponse>('/history/conversations?limit=3', { token });
    return res.data?.conversations ?? [];
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

async function fetchInteractions(token: string): Promise<Interaction[]> {
  try {
    type InteractionsResponse = {
      success: boolean;
      data: { interactions: Interaction[] };
    };
    const res = await api.get<InteractionsResponse>('/cabinet/interactions', { token });
    return res.data?.interactions ?? [];
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

async function fetchCabinetCount(token: string): Promise<number> {
  try {
    type CabinetResponse = {
      success: boolean;
      data: { items: unknown[]; total?: number };
    };
    const res = await api.get<CabinetResponse>('/cabinet?active=true&limit=1', { token });
    // Backend returns total in data.total if paginated, else count items
    return res.data?.total ?? res.data?.items?.length ?? 0;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return 0;
    throw err;
  }
}

async function fetchProfilePct(token: string): Promise<number> {
  try {
    type ProfileResponse = {
      success: boolean;
      data: { completeness?: number; profile?: { completeness?: number } };
    };
    const res = await api.get<ProfileResponse>('/profile', { token });
    // Backend may return completeness at top level or nested
    const pct =
      res.data?.completeness ??
      res.data?.profile?.completeness ??
      0;
    return Math.min(100, Math.max(0, pct));
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 401)) return 0;
    throw err;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function fetchDashboard(token: string): Promise<DashboardData> {
  const [conversations, interactions, cabinetCount, profilePct] = await Promise.all([
    fetchRecentConversations(token),
    fetchInteractions(token),
    fetchCabinetCount(token),
    fetchProfilePct(token),
  ]);

  const alertCount = interactions.filter((i) => isModeratePlus(i.severity)).length;

  return {
    stats: { cabinetCount, alertCount, profilePct },
    recentConversations: conversations,
    interactions: interactions.filter((i) => isModeratePlus(i.severity)),
  };
}
