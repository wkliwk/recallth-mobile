/**
 * SeverityBadge — shows an interaction severity level.
 *
 * Design system: "Major" → danger, "Moderate" → warning, "Minor"/"Safe" → primary.
 * Color never the only signal — also shows icon + label.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

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

export function SeverityBadge({ level }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const SEVERITY_COLORS: Record<SeverityLevel, ColorSet> = {
    major: {
      bg: c.dangerLight,
      border: c.dangerMid,
      text: c.danger,
      icon: '⚠',
      label: 'Major',
    },
    moderate: {
      bg: c.warningLight,
      border: c.warningMid,
      text: c.warning,
      icon: '⚠',
      label: 'Moderate',
    },
    minor: {
      bg: c.primaryLight,
      border: c.primaryMid,
      text: c.primary,
      icon: 'ℹ',
      label: 'Minor',
    },
    safe: {
      bg: c.primaryLight,
      border: c.primaryMid,
      text: c.primary,
      icon: '✓',
      label: 'Safe',
    },
  };

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
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
}
