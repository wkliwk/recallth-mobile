import { api, apiRequest } from './api';

export interface BloodworkEntry {
  _id: string;
  date: string;
  marker: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
  createdAt: string;
}

export interface CreateBloodworkInput {
  date: string;
  marker: string;
  value: number;
  unit: string;
  refLow?: number;
  refHigh?: number;
}

export interface BloodworkInterpretation {
  marker: string;
  latestValue: number;
  unit: string;
  status: 'above_range' | 'below_range' | 'in_range';
  summary: string;
  personalised_insight: string;
  recommendation: string;
  supplement_link: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface InterpretResponse {
  interpretations: BloodworkInterpretation[];
  overall_summary: string;
  generated_at: string;
}

interface ListResponse {
  success: boolean;
  data: BloodworkEntry[];
}

interface CreateResponse {
  success: boolean;
  data: BloodworkEntry;
}

interface InterpretApiResponse {
  success: boolean;
  data: InterpretResponse;
  error: string | null;
}

export async function listBloodwork(token: string): Promise<BloodworkEntry[]> {
  const res = await api.get<ListResponse>('/bloodwork', { token });
  return res.data;
}

export async function createBloodworkEntry(input: CreateBloodworkInput, token: string): Promise<BloodworkEntry> {
  const res = await api.post<CreateResponse>('/bloodwork', input, { token });
  return res.data;
}

export async function interpretBloodwork(token: string): Promise<InterpretResponse> {
  const res = await apiRequest<InterpretApiResponse>('/bloodwork/interpret', { method: 'POST', body: {}, token });
  return res.data;
}
