/**
 * CompletenessBar — horizontal progress bar showing profile completeness %.
 *
 * Design: thin pill track, brand-green fill, label at right.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  percent: number; // 0–100
}

export default function CompletenessBar({ percent }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: percent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [animatedWidth, percent]);

  const widthInterpolated = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Profile completeness</Text>
        <Text style={styles.pct}>{percent}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { width: widthInterpolated }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percent }}
        />
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.screenPad,
      paddingVertical: spacing.lg,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      ...typography.bodySmall,
      color: c.text2,
    },
    pct: {
      ...typography.bodyStrong,
      color: c.primary,
    },
    track: {
      height: 6,
      backgroundColor: c.primaryMid,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: c.primary,
      borderRadius: radius.full,
    },
  });
}
