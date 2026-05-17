import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { buildSevenDayStrip, type IntakeStreak } from '../../services/trends';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import TrendsCard from './TrendsCard';

interface Props {
  streak: IntakeStreak | null;
}

export default function StreakCard({ streak }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

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
        {cells.map((cell) => (
          <View key={cell.date} style={styles.dayCol}>
            <View
              style={[
                styles.dayDot,
                cell.taken && styles.dayDotTaken,
                cell.isToday && styles.dayDotToday,
              ]}
            />
            <Text style={[styles.dayLabel, cell.isToday && styles.dayLabelToday]}>
              {cell.weekday[0]}
            </Text>
          </View>
        ))}
      </View>
    </TrendsCard>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    fractionRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    bigNumber: {
      fontSize: 44,
      lineHeight: 52,
      fontWeight: '700',
      color: c.text,
    },
    bigUnit: {
      ...typography.body,
      color: c.text2,
      marginLeft: 4,
    },
    subline: {
      ...typography.bodySmall,
      color: c.text2,
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
      color: c.text,
    },
    emptyBody: {
      ...typography.bodySmall,
      color: c.text2,
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
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    dayDotTaken: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    dayDotToday: {
      borderColor: c.primaryBright,
      borderWidth: 2,
    },
    dayLabel: {
      ...typography.caption,
      color: c.text3,
    },
    dayLabelToday: {
      color: c.primaryBright,
      fontWeight: '700',
    },
  });
}
