import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WeightEntry } from '../../services/profile';
import { computeWeightDelta, type WeightTrendEntry } from '../../services/trends';
import { colors, spacing, typography } from '../../utils/theme';
import WeightLogChart from '../profile/WeightLogChart';
import TrendsCard from './TrendsCard';

interface Props {
  entries: WeightTrendEntry[];
}

function toWeightLogEntries(entries: WeightTrendEntry[]): WeightEntry[] {
  return entries.map((e) => ({ date: e.timestamp, weight_kg: e.value }));
}

function formatDelta(delta: number): { text: string; color: string } {
  if (delta === 0) return { text: '±0.0 kg', color: colors.text2 };
  const sign = delta > 0 ? '+' : '';
  return {
    text: `${sign}${delta.toFixed(1)} kg`,
    color: delta > 0 ? colors.warning : colors.ok,
  };
}

export default function WeightCard({ entries }: Props) {
  const delta = computeWeightDelta(entries, 30);

  if (entries.length === 0) {
    return (
      <TrendsCard label="Weight trend">
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No weight logged yet</Text>
          <Text style={styles.emptyBody}>
            Add your weight on the Profile screen to see a 30-day trend here.
          </Text>
        </View>
      </TrendsCard>
    );
  }

  const latest = entries[entries.length - 1];
  const deltaFmt = delta ? formatDelta(delta.delta) : null;

  return (
    <TrendsCard label="Weight trend">
      <View style={styles.headRow}>
        <Text style={styles.latestValue}>{latest.value} kg</Text>
        {deltaFmt && (
          <Text style={[styles.deltaText, { color: deltaFmt.color }]}>
            {deltaFmt.text} <Text style={styles.deltaCaption}>vs 30d ago</Text>
          </Text>
        )}
      </View>

      <View style={styles.chartWrap}>
        <WeightLogChart entries={toWeightLogEntries(entries)} chartHeight={90} />
      </View>
    </TrendsCard>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  latestValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: colors.text,
  },
  deltaText: {
    ...typography.bodyStrong,
  },
  deltaCaption: {
    ...typography.bodySmall,
    color: colors.text3,
    fontWeight: '400',
  },
  chartWrap: {
    gap: spacing.sm,
  },
  empty: {
    paddingVertical: spacing.sm,
    gap: 4,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  emptyBody: {
    ...typography.bodySmall,
    color: colors.text2,
  },
});
