import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type DoseLogEntry } from '../../services/schedule';
import { colors, radius, spacing, typography } from '../../utils/theme';
import TrendsCard from './TrendsCard';

interface Props {
  logs: DoseLogEntry[];
  totalScheduled: number;
}

interface DayBar {
  date: string;
  weekday: string;
  pct: number;
  isToday: boolean;
  count: number;
}

function buildWeekBars(logs: DoseLogEntry[], totalScheduled: number): DayBar[] {
  const today = new Date();
  const bars: DayBar[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const dayLogs = logs.filter((l) => l.takenAt.slice(0, 10) === dateStr);
    const count = dayLogs.length;
    const pct = totalScheduled > 0 ? Math.min(1, count / totalScheduled) : 0;

    bars.push({
      date: dateStr,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      pct,
      isToday: i === 0,
      count,
    });
  }

  return bars;
}

const BAR_HEIGHT = 80;

export default function AdherenceCard({ logs, totalScheduled }: Props) {
  const bars = useMemo(() => buildWeekBars(logs, totalScheduled), [logs, totalScheduled]);
  const hasData = logs.length > 0;

  const avgPct = useMemo(() => {
    const sum = bars.reduce((acc, b) => acc + b.pct, 0);
    return Math.round((sum / bars.length) * 100);
  }, [bars]);

  return (
    <TrendsCard label="7-day adherence">
      {hasData ? (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.avgNumber}>{avgPct}%</Text>
            <Text style={styles.avgLabel}> avg this week</Text>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No doses logged yet</Text>
          <Text style={styles.emptyBody}>
            Mark doses as taken on the Home tab to track weekly adherence.
          </Text>
        </View>
      )}

      {/* Bar chart */}
      <View style={styles.chartRow}>
        {bars.map((bar) => (
          <View key={bar.date} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: BAR_HEIGHT * bar.pct },
                  bar.isToday ? styles.barFillToday : styles.barFillPast,
                  bar.pct === 0 && styles.barFillEmpty,
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, bar.isToday && styles.dayLabelToday]}>
              {bar.weekday.slice(0, 1)}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>Today</Text>
        <View style={[styles.legendDot, { backgroundColor: colors.text4, marginLeft: spacing.md }]} />
        <Text style={styles.legendText}>Past days</Text>
      </View>
    </TrendsCard>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  avgNumber: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 48,
  },
  avgLabel: {
    ...typography.body,
    color: colors.text2,
    marginLeft: 4,
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
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    height: BAR_HEIGHT + 24,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_HEIGHT + 24,
  },
  barTrack: {
    width: '100%',
    height: BAR_HEIGHT,
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: radius.sm,
    minHeight: 4,
  },
  barFillToday: {
    backgroundColor: colors.primary,
  },
  barFillPast: {
    backgroundColor: colors.text4,
  },
  barFillEmpty: {
    opacity: 0,
    minHeight: 0,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.text3,
    marginTop: 4,
  },
  dayLabelToday: {
    color: colors.primaryBright,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.text3,
  },
});
