/**
 * SkeletonRow — shimmer placeholder for HistoryRow loading state.
 * Simple static version (no animation dep needed for MVP).
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

export function SkeletonRow(): React.JSX.Element {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.row}>
      <View style={styles.icon} />
      <View style={styles.content}>
        <View style={styles.titleBar} />
        <View style={styles.subtitleBar} />
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPad,
    paddingVertical: spacing.md,
    backgroundColor: c.surface,
    marginHorizontal: spacing.screenPad,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: c.cardSolid,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  titleBar: {
    height: 14,
    width: '70%',
    borderRadius: radius.sm,
    backgroundColor: c.cardSolid,
  },
  subtitleBar: {
    height: 12,
    width: '45%',
    borderRadius: radius.sm,
    backgroundColor: c.cardSolid,
  },
});}
