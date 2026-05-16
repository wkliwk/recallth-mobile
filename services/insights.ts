import { api } from './api';

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
