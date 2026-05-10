/**
 * CompletenessBar — horizontal progress bar showing profile completeness %.
 *
 * Design: thin pill track, brand-green fill, label at right.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../utils/theme';

interface Props {
  percent: number; // 0–100
}

export default function CompletenessBar({ percent }: Props) {
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPad,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.bodySmall,
    color: colors.text2,
  },
  pct: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  track: {
    height: 6,
    backgroundColor: colors.primaryMid,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
