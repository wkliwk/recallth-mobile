/**
 * ChatBubble — renders a single chat message.
 *
 * User: gradient green, right-aligned, tail bottom-right.
 * Assistant: card-solid bg + border, left-aligned, tail bottom-left. Paired with AI avatar.
 * During streaming, renders streamingContent instead of content so the user
 * sees text appearing word-by-word.
 */

import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import type { LocalMessage } from '../../stores/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  message: LocalMessage;
}

const MAX_BUBBLE_WIDTH = 280;

// ─── AI avatar ────────────────────────────────────────────────────────────────

function AIAvatar() {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>AI</Text>
    </View>
  );
}

// ─── Typing indicator (3-dot animation) ──────────────────────────────────────

function TypingDots() {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.typingRow}>
      <ActivityIndicator size="small" color={c.ai} />
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatBubble = React.memo(function ChatBubble({ message }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  // User
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screenPad,
  },
  userBubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    backgroundColor: c.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userText: {
    ...typography.body,
    color: '#fff',
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
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  assistantBubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    backgroundColor: c.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  assistantText: {
    ...typography.body,
    color: c.text,
  },

  // Typing indicator
  typingRow: {
    paddingVertical: spacing.xs,
  },
});}
