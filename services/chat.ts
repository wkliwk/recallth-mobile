/**
 * Chat service — wraps the backend /chat endpoint.
 *
 * The backend returns a full JSON response (not SSE). We simulate token-by-token
 * streaming on the client by chunking the response text after it arrives, which
 * gives the signature streamed-text UX without requiring SSE infrastructure.
 *
 * POST /chat — send a message, receive AI reply + extracted data
 * GET /chat/history — paginated conversation list
 * GET /chat/:conversationId — full conversation
 */

import { API_BASE_URL } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: string;
  extractedData?: ExtractedData | null;
  actions?: ChatAction[];
}

export interface ExtractedData {
  profile?: Record<string, unknown>;
  cabinet?: Array<{ name: string; type?: string; dosage?: string }>;
  summary?: string;
}

export interface ChatAction {
  type: string;
  label: string;
  data: Record<string, unknown>;
  applied?: boolean;
}

export interface Conversation {
  _id: string;
  title?: string;
  summary?: string;
  createdAt: string;
  messageCount?: number;
  messages?: ChatMessage[];
}

export interface SendMessageResponse {
  conversationId: string;
  message: ChatMessage;
  extractedData: ExtractedData | null;
  detectedLanguage: string;
  suggestions: string[];
  actions: ChatAction[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function sendMessage(params: {
  message: string;
  conversationId?: string;
  language?: string;
  token: string;
}): Promise<SendMessageResponse> {
  const url = `${API_BASE_URL}/chat`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      message: params.message,
      conversationId: params.conversationId,
      language: params.language,
    }),
  });

  const payload = (await response.json()) as {
    success: boolean;
    error: string | null;
    data: SendMessageResponse | null;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? `Chat request failed (${response.status})`);
  }

  return payload.data;
}

export async function getHistory(params: {
  page?: number;
  token: string;
}): Promise<{ conversations: Conversation[]; page: number; limit: number }> {
  const page = params.page ?? 1;
  const url = `${API_BASE_URL}/chat/history?page=${page}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
  });

  const payload = (await response.json()) as {
    success: boolean;
    error: string | null;
    data: { conversations: Conversation[]; page: number; limit: number } | null;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? `Failed to load history (${response.status})`);
  }

  return payload.data;
}

export async function getConversation(params: {
  conversationId: string;
  token: string;
}): Promise<Conversation> {
  const url = `${API_BASE_URL}/chat/${params.conversationId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${params.token}`,
    },
  });

  const payload = (await response.json()) as {
    success: boolean;
    error: string | null;
    data: Conversation | null;
  };

  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.error ?? `Failed to load conversation (${response.status})`);
  }

  return payload.data;
}
