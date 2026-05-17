import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../utils/theme';
import { useThemeColors } from '../utils/useTheme';

type SkeletonRowProps = {
  /** Row variant. Default renders a conversation-list skeleton. */
  variant?: 'conversation' | 'stat';
};

/**
 * Shimmer skeleton placeholder — matches the visual footprint of a populated
 * list row or stat tile so the layout doesn't shift on load.
 */
export function SkeletonRow({ variant = 'conversation' }: SkeletonRowProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [opacity]);

  if (variant === 'stat') {
    return (
      <Animated.View style={[styles.statTile, { opacity }]}>
        <View style={styles.statValue} />
        <View style={styles.statLabel} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <View style={styles.avatar} />
      <View style={styles.lines}>
        <View style={styles.lineTitle} />
        <View style={styles.lineSub} />
      </View>
    </Animated.View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md - 2,
      paddingVertical: spacing.sm,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 11,
      backgroundColor: c.cardSolid,
    },
    lines: {
      flex: 1,
      gap: 6,
    },
    lineTitle: {
      height: 14,
      borderRadius: radius.sm,
      backgroundColor: c.cardSolid,
      width: '72%',
    },
    lineSub: {
      height: 11,
      borderRadius: radius.sm,
      backgroundColor: c.cardSolid,
      width: '45%',
    },
    // Stat variant
    statTile: {
      flex: 1,
      height: 72,
      borderRadius: radius.xl,
      backgroundColor: c.cardSolid,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    statValue: {
      height: 24,
      width: 32,
      borderRadius: radius.sm,
      backgroundColor: c.border,
    },
    statLabel: {
      height: 10,
      width: 40,
      borderRadius: radius.sm,
      backgroundColor: c.border,
    },
  });
}
