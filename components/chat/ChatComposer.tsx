/**
 * ChatComposer — pinned-to-bottom message input bar.
 *
 * - KeyboardAvoidingView handles keyboard push-up (padding on iOS, height on Android).
 * - Send button uses AI purple brand color.
 * - Disabled while isLoading (shows spinner instead of send icon).
 * - Multiline TextInput expands up to 5 lines, then scrolls.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
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

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

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
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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
            placeholderTextColor={c.text3}
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
              <ActivityIndicator size="small" color={c.surface} />
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  container: {
    backgroundColor: c.bg,
    borderTopWidth: 1,
    borderTopColor: c.border,
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
    backgroundColor: c.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: c.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: c.text4,
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: c.surface,
    lineHeight: 24,
  },
});}
