/**
 * QuickPromptChip — pill-shaped prompt suggestion chip.
 *
 * Shown in the empty-state grid. Tapping it fires the prompt directly
 * into the composer's send handler. Used on Home hero and Chat empty state.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

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
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  chip: {
    backgroundColor: c.primaryLight,
    borderWidth: 1,
    borderColor: c.primaryMid,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipPressed: {
    opacity: 0.7,
    backgroundColor: c.primaryMid,
  },
  label: {
    ...typography.bodySmall,
    color: c.primary,
    fontWeight: '500',
  },
});}
