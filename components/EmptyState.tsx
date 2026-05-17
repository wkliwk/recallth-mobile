import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ColorPalette, radius, spacing, typography } from '../utils/theme';
import { useThemeColors } from '../utils/useTheme';

interface Props {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
  skipLabel?: string;
  onSkip?: () => void;
}

export function EmptyState({ icon = 'flask-outline', title, subtitle, ctaLabel, onCta, skipLabel, onSkip }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={36} color={c.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Pressable
        onPress={onCta}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
      >
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
      {skipLabel && onSkip && (
        <Pressable
          onPress={onSkip}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
        >
          <Text style={styles.skip}>{skipLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: spacing.xxxl,
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: radius.xl,
      backgroundColor: c.primaryLight,
      borderWidth: 1.5,
      borderColor: c.primary + '40',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.3,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: c.text2,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    cta: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      marginBottom: spacing.md,
    },
    ctaText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    skip: { fontSize: 14, color: c.text3, fontWeight: '500' },
  });
}
