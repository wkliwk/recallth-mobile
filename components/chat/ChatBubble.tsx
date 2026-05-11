/**
 * ChatBubble — renders a single chat message.
 *
 * User: gradient green, right-aligned, tail bottom-right.
 * Assistant: card-solid bg + border, left-aligned, tail bottom-left. Paired with AI avatar.
 * During streaming, renders streamingContent instead of content so the user
 * sees text appearing word-by-word.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '../../utils/theme';
import type { LocalMessage } from '../../stores/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  message: LocalMessage;
}

// ─── AI avatar ────────────────────────────────────────────────────────────────

function AIAvatar() {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>AI</Text>
    </View>
  );
}

// ─── Typing indicator (3-dot animation) ──────────────────────────────────────

function TypingDots() {
  return (
    <View style={styles.typingRow}>
      <ActivityIndicator size="small" color={colors.ai} />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatBubble = React.memo(function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming ?? false;
  const displayText = isStreaming
    ? (message.streamingContent ?? '')
    : message.content;
  const showTypingDots = isStreaming && displayText.length === 0;

  if (isUser) {
    return (
      <View style={styles.userRow} accessibilityRole="text" accessibilityLabel={`You said: ${message.content}`}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{displayText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.assistantRow}
      accessibilityRole="text"
      accessibilityLabel={`Assistant: ${message.content}`}
    >
      <AIAvatar />
      <View style={styles.assistantBubble}>
        {showTypingDots ? (
          <TypingDots />
        ) : (
          <Text style={styles.assistantText}>{displayText}</Text>
        )}
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const MAX_BUBBLE_WIDTH = 280;

const styles = StyleSheet.create({
  // User
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screenPad,
  },
  userBubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userText: {
    ...typography.body,
    color: colors.surface,
  },

  // Assistant
  assistantRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screenPad,
    gap: spacing.sm,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.surface,
  },
  assistantBubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  assistantText: {
    ...typography.body,
    color: colors.text,
  },

  // Typing indicator
  typingRow: {
    paddingVertical: spacing.xs,
  },
});
