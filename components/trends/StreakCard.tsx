import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { buildSevenDayStrip, type IntakeStreak } from '../../services/trends';
import { colors, radius, spacing, typography } from '../../utils/theme';
import TrendsCard from './TrendsCard';

interface Props {
  streak: IntakeStreak | null;
}

export default function StreakCard({ streak }: Props) {
  const isEmpty = !streak || (streak.currentStreak === 0 && streak.longestStreak === 0);
  const cells = buildSevenDayStrip(streak);

  return (
    <TrendsCard label="Adherence streak">
      {isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No streak yet</Text>
          <Text style={styles.emptyBody}>
            Mark a dose as taken on the Summary tab to start your streak.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.fractionRow}>
            <Text style={styles.bigNumber}>{streak!.currentStreak}</Text>
            <Text style={styles.bigUnit}> day{streak!.currentStreak === 1 ? '' : 's'}</Text>
          </View>
          <Text style={styles.subline}>
            Longest streak: {streak!.longestStreak} day{streak!.longestStreak === 1 ? '' : 's'}
          </Text>
        </>
      )}

      <View style={styles.stripRow}>
        {cells.map((c) => (
          <View key={c.date} style={styles.dayCol}>
            <View
              style={[
                styles.dayDot,
                c.taken && styles.dayDotTaken,
                c.isToday && styles.dayDotToday,
              ]}
            />
            <Text style={[styles.dayLabel, c.isToday && styles.dayLabelToday]}>
              {c.weekday[0]}
            </Text>
          </View>
        ))}
      </View>
    </TrendsCard>
  );
}

const styles = StyleSheet.create({
  fractionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigNumber: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '700',
    color: colors.text,
  },
  bigUnit: {
    ...typography.body,
    color: colors.text2,
    marginLeft: 4,
  },
  subline: {
    ...typography.bodySmall,
    color: colors.text2,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  empty: {
    paddingVertical: spacing.sm,
    gap: 4,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  emptyBody: {
    ...typography.bodySmall,
    color: colors.text2,
  },
  stripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dayDot: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayDotTaken: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayDotToday: {
    borderColor: colors.primaryBright,
    borderWidth: 2,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.text3,
  },
  dayLabelToday: {
    color: colors.primaryBright,
    fontWeight: '700',
  },
});
