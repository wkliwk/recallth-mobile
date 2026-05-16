/**
 * FilterChip — pill-style filter selector for the History screen.
 * Variants: All / Chats / Cabinet / Doses
 */

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '../../utils/theme';

export type FilterValue = 'all' | 'conversation' | 'cabinet_change' | 'profile_change' | 'dose';

interface Props {
  label: string;
  value: FilterValue;
  active: boolean;
  onPress: (value: FilterValue) => void;
}

export function FilterChip({ label, value, active, onPress }: Props): React.JSX.Element {
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

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMid,
  },
  chipPressed: {
    opacity: 0.8,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text2,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});
