import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

function buildBars(logs: DoseLogEntry[], totalScheduled: number, days = 14): DayBar[] {
  const today = new Date();
  const bars: DayBar[] = [];

  for (let i = days - 1; i >= 0; i--) {
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

function barColor(pct: number): string {
  if (pct === 0) return colors.border;
  if (pct >= 1) return colors.ok;
  return colors.warning;
}

const BAR_HEIGHT = 72;

export default function AdherenceCard({ logs, totalScheduled }: Props) {
  const bars = useMemo(() => buildBars(logs, totalScheduled, 14), [logs, totalScheduled]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const daysWithData = bars.filter((b) => b.count > 0).length;
  const hasEnoughData = daysWithData >= 2;

  const avgPct = useMemo(() => {
    const activeBars = bars.filter((b) => b.pct > 0);
    if (activeBars.length === 0) return 0;
    const sum = activeBars.reduce((acc, b) => acc + b.pct, 0);
    return Math.round((sum / activeBars.length) * 100);
  }, [bars]);

  const selectedBar = selectedIdx !== null ? bars[selectedIdx] : null;

  return (
    <TrendsCard label="Dose Adherence — Last 14 Days">
      {!hasEnoughData ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Not enough data yet</Text>
          <Text style={styles.emptyBody}>
            Log doses on the Home tab for at least 2 days to see your adherence chart.
          </Text>
        </View>
      ) : (
        <View style={styles.summaryRow}>
          <Text style={styles.avgNumber}>{avgPct}%</Text>
          <Text style={styles.avgLabel}> avg on active days</Text>
        </View>
      )}

      {/* Tooltip row */}
      <View style={styles.tooltipRow}>
        {selectedBar !== null ? (
          <Text style={styles.tooltip}>
            {selectedBar.weekday} {selectedBar.date.slice(5)} — {selectedBar.count} of {totalScheduled} dose{totalScheduled !== 1 ? 's' : ''}
          </Text>
        ) : (
          <Text style={styles.tooltipHint}>Tap a bar for details</Text>
        )}
      </View>

      {/* Bar chart */}
      <View style={styles.chartRow}>
        {bars.map((bar, idx) => (
          <Pressable
            key={bar.date}
            style={styles.barCol}
            onPress={() => setSelectedIdx((prev) => (prev === idx ? null : idx))}
            accessibilityRole="button"
            accessibilityLabel={`${bar.weekday}: ${bar.count} of ${totalScheduled} doses`}
          >
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: Math.max(BAR_HEIGHT * bar.pct, bar.pct > 0 ? 4 : 0) },
                  { backgroundColor: barColor(bar.pct) },
                  selectedIdx === idx && styles.barSelected,
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, bar.isToday && styles.dayLabelToday]}>
              {bar.weekday.slice(0, 1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: colors.ok }]} />
        <Text style={styles.legendText}>All</Text>
        <View style={[styles.legendDot, { backgroundColor: colors.warning, marginLeft: spacing.md }]} />
        <Text style={styles.legendText}>Partial</Text>
        <View style={[styles.legendDot, { backgroundColor: colors.border, marginLeft: spacing.md }]} />
        <Text style={styles.legendText}>None</Text>
      </View>
    </TrendsCard>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  avgNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 44,
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
  tooltipRow: {
    minHeight: 20,
    marginBottom: spacing.sm,
  },
  tooltip: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  tooltipHint: {
    ...typography.caption,
    color: colors.text4,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: BAR_HEIGHT + 20,
    marginBottom: spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: BAR_HEIGHT + 20,
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
  },
  barSelected: {
    opacity: 0.75,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.text3,
    marginTop: 4,
    fontSize: 9,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
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
