import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

type DoseProgressCardProps = {
  taken: number;
  total: number;
};

export function DoseProgressCard({ taken, total }: DoseProgressCardProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const progress = total > 0 ? taken / total : 0;
  const allDone = taken === total && total > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Today's doses</Text>

      <View style={styles.fractionRow}>
        <Text style={styles.takenCount}>{taken}</Text>
        <Text style={styles.totalCount}> / {total} taken</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progress * 100)}%` as `${number}%` },
            allDone && styles.progressFillDone,
          ]}
        />
      </View>

      <Text style={[styles.statusText, allDone && styles.statusTextDone]}>
        {allDone
          ? 'All done for today ✓'
          : total > 0
            ? `${Math.round(progress * 100)}% · ${total - taken} remaining`
            : 'No doses scheduled'}
      </Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  card: {
    backgroundColor: c.cardSolid,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.xl,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: c.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  fractionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  takenCount: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
    letterSpacing: -1.5,
    color: c.text,
  },
  totalCount: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    color: c.text2,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: c.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: c.primary,
  },
  progressFillDone: {
    backgroundColor: c.ok,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    color: c.text2,
    marginTop: spacing.xs,
  },
  statusTextDone: {
    color: c.ok,
    fontWeight: '600',
  },
});};
