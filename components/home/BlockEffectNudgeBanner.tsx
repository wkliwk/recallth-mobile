import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  blockLabel: string;
  onRateNow: () => void;
  onLater: () => void;
}

function BlockEffectNudgeBannerInner({ blockLabel, onRateNow, onLater }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How do you feel?</Text>
        <Text style={styles.subtitle}>After your {blockLabel} supplements</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onRateNow}
          style={({ pressed }) => [styles.rateBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`Rate how you feel after ${blockLabel} supplements`}
        >
          <Text style={styles.rateText}>Rate →</Text>
        </Pressable>
        <Pressable
          onPress={onLater}
          style={({ pressed }) => [styles.laterBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
        >
          <Text style={styles.laterText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const BlockEffectNudgeBanner = memo(BlockEffectNudgeBannerInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      marginHorizontal: spacing.screenPad,
      marginBottom: spacing.md,
      backgroundColor: c.infoLight,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.info,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    content: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.bodyStrong,
      color: c.info,
    },
    subtitle: {
      ...typography.caption,
      color: c.text2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
    },
    rateBtn: {
      backgroundColor: c.info,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    rateText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },
    laterBtn: {
      padding: spacing.xs,
    },
    laterText: {
      fontSize: 14,
      color: c.text3,
    },
  });
}
