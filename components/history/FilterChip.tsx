/**
 * FilterChip — pill-style filter selector for the History screen.
 * Variants: All / Chats / Cabinet / Doses
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

export type FilterValue = 'all' | 'conversation' | 'cabinet_change' | 'profile_change' | 'dose';

interface Props {
  label: string;
  value: FilterValue;
  active: boolean;
  onPress: (value: FilterValue) => void;
}

export function FilterChip({ label, value, active, onPress }: Props): React.JSX.Element {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
      onPress={() => onPress(value)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderStrong,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: c.primaryLight,
    borderColor: c.primaryMid,
  },
  chipPressed: {
    opacity: 0.8,
  },
  label: {
    ...typography.bodySmall,
    color: c.text2,
    fontWeight: '500',
  },
  labelActive: {
    color: c.primary,
    fontWeight: '600',
  },
});}
