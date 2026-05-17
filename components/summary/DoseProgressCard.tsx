import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

type DoseProgressCardProps = {
  taken: number;
  total: number;
};

/**
 * Hero card showing today's dose fraction and a horizontal progress bar.
 * Background: warm cream (colors.cardSolid) on white surface.
 */
export function DoseProgressCard({ taken, total }: DoseProgressCardProps) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSolid,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.primary,
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
    color: colors.text,
  },
  totalCount: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    color: colors.text2,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  progressFillDone: {
    backgroundColor: colors.ok,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text2,
    marginTop: spacing.xs,
  },
  statusTextDone: {
    color: colors.ok,
    fontWeight: '600',
  },
});
