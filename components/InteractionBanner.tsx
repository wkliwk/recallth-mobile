import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../utils/theme';
import { useThemeColors } from '../utils/useTheme';

type Severity = 'moderate' | 'major';

type InteractionBannerProps = {
  /** Number of interactions at severity >= moderate. */
  count: number;
  /** Highest severity among current interactions. Defaults to 'moderate'. */
  severity?: Severity;
  /** Called when the user taps "Review" or the banner itself. */
  onReview?: () => void;
};

/**
 * Shown when /cabinet/interactions returns any severity >= moderate.
 * Renders nothing when count is 0.
 */
export function InteractionBanner({
  count,
  severity = 'moderate',
  onReview,
}: InteractionBannerProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (count === 0) return null;

  const isMajor = severity === 'major';
  const bgColor = isMajor ? c.dangerLight : c.warningLight;
  const borderColor = isMajor ? c.dangerMid : c.warningMid;
  const textColor = isMajor ? c.danger : c.warning;
  const icon = isMajor ? '⚠' : '⚠';
  const label =
    count === 1
      ? `1 interaction needs review`
      : `${count} interactions need review`;
  const sublabel = isMajor
    ? 'Major severity — check before taking'
    : 'Moderate severity — check your stack';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.banner,
        { backgroundColor: bgColor, borderColor },
        pressed && styles.pressed,
      ]}
      onPress={onReview}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Tap to review.`}
    >
      <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>
      <View style={styles.body}>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        <Text style={[styles.sublabel, { color: textColor }]}>{sublabel}</Text>
      </View>
      <Text style={[styles.reviewBtn, { color: textColor }]}>Review</Text>
    </Pressable>
  );
}

function makeStyles(_c: ColorPalette) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    pressed: {
      opacity: 0.85,
    },
    icon: {
      fontSize: 18,
      lineHeight: 22,
    },
    body: {
      flex: 1,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },
    sublabel: {
      fontSize: 12,
      lineHeight: 16,
      opacity: 0.85,
      marginTop: 1,
    },
    reviewBtn: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
    },
  });
}
