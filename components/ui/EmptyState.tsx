/**
 * EmptyState — generic empty list placeholder.
 * Renders an illustration (emoji), heading, and optional CTA.
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  illustration?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  illustration = '📭',
  title,
  subtitle,
  ctaLabel,
  onCta,
}: Props): React.JSX.Element {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.container}>
      <Text style={styles.illustration}>{illustration}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCta ? (
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPad,
    gap: spacing.md,
  },
  illustration: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: c.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: c.text2,
    textAlign: 'center',
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: c.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    ...typography.cta,
    color: c.surface,
  },
});}
