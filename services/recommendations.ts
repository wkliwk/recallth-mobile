import { api } from './api';

export interface Recommendation {
  name: string;
  type: 'supplement' | 'vitamin' | 'medication';
  dosage?: string;
  frequency?: string;
  benefit: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export async function getRecommendations(token: string): Promise<Recommendation[]> {
  const res = await api.get<ApiResponse<Recommendation[]>>('/recommendations', { token });
  return Array.isArray(res.data) ? res.data : [];
}

export async function bustRecommendationsCache(token: string): Promise<void> {
  await api.delete('/recommendations/cache', { token });
}
