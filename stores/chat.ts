/**
 * Chat store — manages conversation state, message sending, and streaming simulation.
 *
 * The backend returns a full JSON response. We simulate streaming by revealing
 * the assistant message character-by-character after the response arrives so
 * the user sees the token-by-token UX without requiring SSE.
 */

import { create } from 'zustand';

import * as chatService from '../services/chat';

export type { ChatMessage, ExtractedData, ChatAction, Conversation } from '../services/chat';

// ─── Local message shape (includes optimistic / streaming states) ─────────────

export interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Content being revealed character-by-character during streaming simulation */
  streamingContent?: string;
  isStreaming?: boolean;
  timestamp: string;
  extractedData?: chatService.ExtractedData | null;
  actions?: chatService.ChatAction[];
}

export interface ExtractionToastData {
  id: string;
  summary: string;
  /** Route to navigate to on tap */
  targetRoute: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

type ChatState = {
  messages: LocalMessage[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
  extractionToasts: ExtractionToastData[];

  sendMessage: (content: string, token: string) => Promise<void>;
  loadConversation: (conversationId: string, token: string) => Promise<void>;
  startNewConversation: () => void;
  dismissToast: (toastId: string) => void;
  clearError: () => void;
};

function buildToasts(
  extractedData: chatService.ExtractedData | null,
): ExtractionToastData[] {
  if (!extractedData) return [];

  const toasts: ExtractionToastData[] = [];

  const cabinetItems = extractedData.cabinet ?? [];
  if (cabinetItems.length > 0) {
    const names = cabinetItems.slice(0, 3).map((i) => i.name).join(', ');
    const extra = cabinetItems.length > 3 ? ` +${cabinetItems.length - 3} more` : '';
    toasts.push({
      id: `toast-cabinet-${Date.now()}`,
      summary: `Saved to cabinet: ${names}${extra}`,
      targetRoute: '/(tabs)/cabinet',
    });
  }

  const profileData = extractedData.profile ?? {};
  if (Object.keys(profileData).length > 0) {
    const count = Object.keys(profileData).length;
    toasts.push({
      id: `toast-profile-${Date.now() + 1}`,
      summary: `Saved ${count} profile ${count === 1 ? 'item' : 'items'}`,
      targetRoute: '/(tabs)/profile',
    });
  }

  return toasts;
}

/** Simulate streaming by revealing text word-by-word at ~40ms intervals */
async function simulateStreaming(
  fullText: string,
  onChunk: (partial: string) => void,
  onDone: () => void,
): Promise<void> {
  const words = fullText.split(' ');
  let revealed = '';
  for (let i = 0; i < words.length; i++) {
    revealed += (i === 0 ? '' : ' ') + words[i];
    onChunk(revealed);
    // Small variance for natural feel: shorter for short words, longer for long
    const delay = words[i].length > 8 ? 45 : 30;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
  onDone();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversationId: null,
  isLoading: false,
  error: null,
  extractionToasts: [],

  sendMessage: async (content: string, token: string) => {
    if (get().isLoading) return;

    const userMessage: LocalMessage = {
      id: makeId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    // Optimistically add user message and set loading
    set((s) => ({
      messages: [...s.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      const response = await chatService.sendMessage({
        message: content,
        conversationId: get().conversationId ?? undefined,
        token,
      });

      // Add a placeholder assistant message that will be streamed into
      const assistantId = makeId();
      const assistantMessage: LocalMessage = {
        id: assistantId,
        role: 'assistant',
        content: response.message,
        streamingContent: '',
        isStreaming: true,
        timestamp: new Date().toISOString(),
        extractedData: response.extractedData,
        actions: response.actions,
      };

      const toasts = buildToasts(response.extractedData);

      set((s) => ({
        messages: [...s.messages, assistantMessage],
        conversationId: response.conversationId,
        isLoading: false,
        extractionToasts: [...s.extractionToasts, ...toasts],
      }));

      // Stream simulation
      await simulateStreaming(
        response.message,
        (partial) => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId ? { ...m, streamingContent: partial } : m,
            ),
          }));
        },
        () => {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === assistantId
                ? { ...m, isStreaming: false, streamingContent: undefined }
                : m,
            ),
          }));
        },
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send message';
      set({ isLoading: false, error: message });
    }
  },

  loadConversation: async (conversationId: string, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const conversation = await chatService.getConversation({
        conversationId,
        token,
      });
      const messages: LocalMessage[] = (conversation.messages ?? []).map(
        (m) => ({
          id: makeId(),
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
          extractedData: m.extractedData,
          actions: m.actions,
        }),
      );
      set({ messages, conversationId, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load conversation';
      set({ isLoading: false, error: message });
    }
  },

  startNewConversation: () => {
    set({ messages: [], conversationId: null, error: null, extractionToasts: [] });
  },

  dismissToast: (toastId: string) => {
    set((s) => ({
      extractionToasts: s.extractionToasts.filter((t) => t.id !== toastId),
    }));
  },

  clearError: () => set({ error: null }),
}));
