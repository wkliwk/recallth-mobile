import { api } from './api';

export type ExtractionSource = 'chat' | 'onboarding' | 'manual';
export type ExtractionStatus = 'pending' | 'confirmed' | 'corrected' | 'rejected';

export interface ExtractionReviewItem {
  _id: string;
  field: string;
  extractedValue: unknown;
  correctedValue?: unknown;
  source: ExtractionSource;
  sourceId?: string;
  status: ExtractionStatus;
  extractedAt: string;
  reviewedAt?: string;
}

interface ExtractionListResponse {
  success: boolean;
  data: { items: ExtractionReviewItem[]; total: number };
}

interface ExtractionReviewResponse {
  success: boolean;
  data: ExtractionReviewItem;
}

export async function listExtractions(token: string): Promise<ExtractionReviewItem[]> {
  const res = await api.get<ExtractionListResponse>('/profile/auto-extracted', { token });
  return res.data?.items ?? [];
}

export async function reviewExtraction(
  token: string,
  id: string,
  action: 'confirm' | 'correct' | 'reject',
  correctedValue?: unknown,
): Promise<ExtractionReviewItem> {
  const body: { action: string; correctedValue?: unknown } = { action };
  if (action === 'correct') body.correctedValue = correctedValue;
  const res = await api.put<ExtractionReviewResponse>(
    `/profile/auto-extracted/${id}`,
    body,
    { token },
  );
  return res.data;
}
