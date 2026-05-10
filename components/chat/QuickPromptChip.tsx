/**
 * QuickPromptChip — pill-shaped prompt suggestion chip.
 *
 * Shown in the empty-state grid. Tapping it fires the prompt directly
 * into the composer's send handler. Used on Home hero and Chat empty state.
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  label: string;
  onPress: (label: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const QuickPromptChip = React.memo(function QuickPromptChip({
  label,
  onPress,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      onPress={() => onPress(label)}
      accessibilityRole="button"
      accessibilityLabel={`Quick prompt: ${label}`}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipPressed: {
    opacity: 0.7,
    backgroundColor: colors.cardSolid,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text2,
    fontWeight: '500',
  },
});
