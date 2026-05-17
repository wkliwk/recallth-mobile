import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WeightEntry } from '../../services/profile';
import { computeWeightDelta, type WeightTrendEntry } from '../../services/trends';
import { ColorPalette, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import WeightLogChart from '../profile/WeightLogChart';
import TrendsCard from './TrendsCard';

interface Props {
  entries: WeightTrendEntry[];
}

function toWeightLogEntries(entries: WeightTrendEntry[]): WeightEntry[] {
  return entries.map((e) => ({ date: e.timestamp, weight_kg: e.value }));
}

export default function WeightCard({ entries }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const delta = computeWeightDelta(entries, 30);

  function formatDelta(deltaVal: number): { text: string; color: string } {
    if (deltaVal === 0) return { text: '±0.0 kg', color: c.text2 };
    const sign = deltaVal > 0 ? '+' : '';
    return {
      text: `${sign}${deltaVal.toFixed(1)} kg`,
      color: deltaVal > 0 ? c.warning : c.ok,
    };
  }

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
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
      color: c.text,
    },
    deltaText: {
      ...typography.bodyStrong,
    },
    deltaCaption: {
      ...typography.bodySmall,
      color: c.text3,
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
      color: c.text,
    },
    emptyBody: {
      ...typography.bodySmall,
      color: c.text2,
    },
  });
}
