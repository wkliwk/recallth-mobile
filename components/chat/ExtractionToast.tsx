/**
 * ExtractionToast — the product's signature UX moment.
 *
 * Appears between the user message and AI response when the AI extracts
 * profile or cabinet data from the conversation. Center-aligned pill with
 * primary-light bg + primary-mid border. Tap routes to the affected screen.
 *
 * Design spec: `Saved: <facts>` — green pill, 1px border, 8/14 padding.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import type { ExtractionToastData } from '../../stores/chat';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  toast: ExtractionToastData;
  onDismiss: (id: string) => void;
  /** Auto-dismiss after ms (default 8000) */
  autoDismissMs?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ExtractionToast = React.memo(function ExtractionToast({
  toast,
  onDismiss,
  autoDismissMs = 8000,
}: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, autoDismissMs]);

  const handlePress = useCallback(() => {
    onDismiss(toast.id);
    // Navigate to the affected route (profile or cabinet)
    router.push(toast.targetRoute as Parameters<typeof router.push>[0]);
  }, [toast.id, toast.targetRoute, onDismiss, router]);

  return (
    <Pressable
      style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={toast.summary}
      accessibilityHint="Tap to view saved items"
    >
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.text}>{toast.summary}</Text>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: c.primaryLight,
      borderWidth: 1,
      borderColor: c.primaryMid,
      borderRadius: radius.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
      marginVertical: spacing.sm,
      marginHorizontal: spacing.screenPad,
    },
    pillPressed: {
      opacity: 0.8,
    },
    checkmark: {
      fontSize: 12,
      color: c.primary,
      fontWeight: '600',
    },
    text: {
      ...typography.bodySmall,
      color: c.primary,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
    },
    arrow: {
      fontSize: 16,
      color: c.primary,
      fontWeight: '600',
    },
  });
}
