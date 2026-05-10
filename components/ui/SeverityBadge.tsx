/**
 * SeverityBadge — shows an interaction severity level.
 *
 * Design system: "Major" → danger, "Moderate" → warning, "Minor"/"Safe" → primary.
 * Color never the only signal — also shows icon + label.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../utils/theme';

export type SeverityLevel = 'major' | 'moderate' | 'minor' | 'safe';

type Props = {
  level: SeverityLevel;
};

type ColorSet = {
  bg: string;
  border: string;
  text: string;
  icon: string;
  label: string;
};

const SEVERITY_COLORS: Record<SeverityLevel, ColorSet> = {
  major: {
    bg: colors.dangerLight,
    border: colors.dangerMid,
    text: colors.danger,
    icon: '⚠',
    label: 'Major',
  },
  moderate: {
    bg: colors.warningLight,
    border: colors.warningMid,
    text: colors.warning,
    icon: '⚠',
    label: 'Moderate',
  },
  minor: {
    bg: colors.primaryLight,
    border: colors.primaryMid,
    text: colors.primary,
    icon: 'ℹ',
    label: 'Minor',
  },
  safe: {
    bg: colors.primaryLight,
    border: colors.primaryMid,
    text: colors.primary,
    icon: '✓',
    label: 'Safe',
  },
};

export function SeverityBadge({ level }: Props) {
  const { bg, border, text, icon, label } = SEVERITY_COLORS[level];

  return (
    <View
      style={[styles.badge, { backgroundColor: bg, borderColor: border }]}
      accessibilityRole="text"
      accessibilityLabel={`${label} interaction`}
    >
      <Text style={[styles.icon, { color: text }]}>{icon}</Text>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 10,
    lineHeight: 14,
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
