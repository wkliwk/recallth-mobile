/**
 * SkeletonRow — shimmer placeholder for HistoryRow loading state.
 * Simple static version (no animation dep needed for MVP).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

export function SkeletonRow(): React.JSX.Element {
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPad,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.screenPad,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.cardSolid,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  titleBar: {
    height: 14,
    width: '70%',
    borderRadius: radius.sm,
    backgroundColor: colors.cardSolid,
  },
  subtitleBar: {
    height: 12,
    width: '45%',
    borderRadius: radius.sm,
    backgroundColor: colors.cardSolid,
  },
});
