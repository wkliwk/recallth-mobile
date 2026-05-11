/**
 * ChatComposer — pinned-to-bottom message input bar.
 *
 * - KeyboardAvoidingView handles keyboard push-up (padding on iOS, height on Android).
 * - Send button uses AI purple brand color.
 * - Disabled while isLoading (shows spinner instead of send icon).
 * - Multiline TextInput expands up to 5 lines, then scrolls.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onSend: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatComposer = React.memo(function ChatComposer({
  onSend,
  isLoading = false,
  placeholder = 'Ask anything about your supplements...',
}: Props) {
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !isLoading;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setText('');
  }, [text, isLoading, onSend]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View
        style={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={styles.row}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={colors.text3}
            multiline
            maxLength={4000}
            numberOfLines={1}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            editable={!isLoading}
            accessibilityLabel="Message input"
            accessibilityHint="Type your message here"
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              !canSend && styles.sendButtonDisabled,
              pressed && canSend && styles.sendButtonPressed,
            ]}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screenPad,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: colors.text4,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.surface,
    lineHeight: 24,
  },
});
