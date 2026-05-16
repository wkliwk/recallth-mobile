/**
 * AI Chat screen — signature UX surface for Recallth.
 *
 * Features:
 * - Persistent thread: resumes latest conversation via stored conversationId.
 * - Streaming simulation: AI responses revealed word-by-word.
 * - Extraction toast: center-aligned pill appears when AI extracts data.
 * - Empty state with 6 quick-prompt chips.
 * - "Not medical advice" disclaimer in header.
 * - Composer pinned to bottom with keyboard handling.
 * - New conversation button in header.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatComposer } from '../../components/chat/ChatComposer';
import { ConversationHistorySheet } from '../../components/chat/ConversationHistorySheet';
import { ExtractionToast } from '../../components/chat/ExtractionToast';
import { QuickPromptChip } from '../../components/chat/QuickPromptChip';
import { useAuthStore } from '../../stores/auth';
import { useChatStore, type LocalMessage, type ExtractionToastData } from '../../stores/chat';
import { colors, radius, spacing, typography } from '../../utils/theme';
import * as storage from '../../services/storage';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONVERSATION_ID_KEY = 'recallth.chat.lastConversationId';

const QUICK_PROMPTS = [
  'Should I take Vitamin D3?',
  'Best time to take Magnesium?',
  'Check my supplement interactions',
  'What does my health profile look like?',
  'Plan a stack for better sleep',
  'Any conflicts with my current supplements?',
];

// ─── List item type ───────────────────────────────────────────────────────────

type ListItem =
  | { kind: 'message'; message: LocalMessage }
  | { kind: 'toast'; toast: ExtractionToastData };

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onPrompt: (text: string) => void;
}

function EmptyState({ onPrompt }: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyAIBadge}>
        <Text style={styles.emptyAIBadgeText}>AI</Text>
      </View>
      <Text style={styles.emptyGreeting}>
        Hi! Ask me anything about your supplements, medications, or health goals.
      </Text>
      <View style={styles.chipsWrap}>
        {QUICK_PROMPTS.map((prompt) => (
          <QuickPromptChip key={prompt} label={prompt} onPress={onPrompt} />
        ))}
      </View>
    </View>
  );
}

// ─── Disclaimer header strip ──────────────────────────────────────────────────

function DisclaimerStrip() {
  return (
    <View style={styles.disclaimer}>
      <Text style={styles.disclaimerText}>
        Not medical advice — always consult your doctor
      </Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const token = useAuthStore((s) => s.token);
  const [historyOpen, setHistoryOpen] = useState(false);
  const {
    messages,
    conversationId,
    isLoading,
    error,
    extractionToasts,
    sendMessage,
    loadConversation,
    startNewConversation,
    dismissToast,
    clearError,
  } = useChatStore();

  const listRef = useRef<FlatList<ListItem>>(null);

  // ── On mount: resume last conversation ──────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const stored = await storage.getItem(CONVERSATION_ID_KEY);
        if (stored && messages.length === 0) {
          await loadConversation(stored, token);
        }
      } catch {
        // Could not restore — start fresh silently
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist conversationId on change ─────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    void storage.setItem(CONVERSATION_ID_KEY, conversationId);
  }, [conversationId]);

  // ── Auto-scroll to bottom on new messages ────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [messages.length]);

  // ── Send handler ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      if (!token) return;
      void sendMessage(text, token);
    },
    [token, sendMessage],
  );

  // ── New conversation ─────────────────────────────────────────────────────────
  const handleNewConversation = useCallback(() => {
    startNewConversation();
    void storage.deleteItem(CONVERSATION_ID_KEY);
  }, [startNewConversation]);

  // ── Build flat list items ────────────────────────────────────────────────────
  // Interleave extraction toasts after the user message that triggered them.
  // Simplification: toasts appear as separate list rows between messages.
  const listItems: ListItem[] = [];
  for (const message of messages) {
    listItems.push({ kind: 'message', message });
    if (message.role === 'user' && extractionToasts.length > 0) {
      // Show pending toasts between user message and assistant response
      const nextIdx = messages.indexOf(message) + 1;
      const nextMessage = messages[nextIdx];
      if (!nextMessage || nextMessage.role === 'assistant') {
        for (const toast of extractionToasts) {
          listItems.push({ kind: 'toast', toast });
        }
      }
    }
  }

  // ── Render list item ─────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'message') {
        return <ChatBubble message={item.message} />;
      }
      return (
        <ExtractionToast toast={item.toast} onDismiss={dismissToast} />
      );
    },
    [dismissToast],
  );

  const keyExtractor = useCallback((item: ListItem) => {
    if (item.kind === 'message') return item.message.id;
    return item.toast.id;
  }, []);

  // ── Error banner ─────────────────────────────────────────────────────────────
  const ErrorBanner = error ? (
    <Pressable style={styles.errorBanner} onPress={clearError} accessibilityRole="alert">
      <Text style={styles.errorText}>{error} — tap to dismiss</Text>
    </Pressable>
  ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Chat</Text>
        <View style={styles.headerBtns}>
          {token !== null && (
            <Pressable
              style={({ pressed }) => [styles.historyBtn, pressed && styles.newBtnPressed]}
              onPress={() => setHistoryOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="View conversation history"
            >
              <Text style={styles.historyBtnText}>History</Text>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.newBtn, pressed && styles.newBtnPressed]}
            onPress={handleNewConversation}
            accessibilityRole="button"
            accessibilityLabel="Start new conversation"
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </Pressable>
        </View>
      </View>

      <DisclaimerStrip />

      {ErrorBanner}

      {/* Message list */}
      {messages.length === 0 ? (
        <EmptyState onPrompt={handleSend} />
      ) : (
        <FlatList
          ref={listRef}
          data={listItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />
      )}

      {/* Composer */}
      <ChatComposer onSend={handleSend} isLoading={isLoading} />

      {token !== null && (
        <ConversationHistorySheet
          visible={historyOpen}
          token={token}
          activeConversationId={conversationId}
          onSelect={(id) => {
            setHistoryOpen(false);
            void loadConversation(id, token);
          }}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPad,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  historyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
  newBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.aiLight,
    borderWidth: 1,
    borderColor: colors.ai,
  },
  newBtnPressed: {
    opacity: 0.7,
  },
  newBtnText: {
    ...typography.bodySmall,
    color: colors.ai,
    fontWeight: '600',
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryMid,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.screenPad,
    alignItems: 'center',
  },
  disclaimerText: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
  },

  // Error
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.dangerMid,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.screenPad,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    textAlign: 'center',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.lg,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPad,
    gap: spacing.lg,
  },
  emptyAIBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.ai,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAIBadgeText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.surface,
  },
  emptyGreeting: {
    ...typography.body,
    color: colors.text2,
    textAlign: 'center',
    maxWidth: 300,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
