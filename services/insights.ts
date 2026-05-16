import { api, apiRequest } from './api';

interface DailyBriefResponse {
  success: boolean;
  data: {
    brief?: string;
    generatedAt?: string;
    fromCache?: boolean;
    insufficientData?: boolean;
  };
}

export async function fetchDailyBrief(token: string): Promise<string | null> {
  const res = await api.post<DailyBriefResponse>('/insights/daily-brief', {}, { token });
  if (res.data.insufficientData || !res.data.brief) return null;
  return res.data.brief;
}

export interface JournalInsightsResult {
  insights: string[];
  generatedAt: string | null;
  insufficientData: boolean;
}

interface JournalInsightsResponse {
  success: boolean;
  data: {
    insights?: string[];
    generatedAt?: string;
    fromCache?: boolean;
    insufficientData?: boolean;
  };
}

export async function fetchJournalInsights(token: string): Promise<JournalInsightsResult> {
  const res = await apiRequest<JournalInsightsResponse>('/insights/journal-insights', { method: 'POST', body: {}, token });
  const d = res.data ?? {};
  return {
    insights: d.insights ?? [],
    generatedAt: d.generatedAt ?? null,
    insufficientData: d.insufficientData ?? false,
  };
}
