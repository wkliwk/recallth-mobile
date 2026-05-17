import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type SupplementEffectAvg } from '../../services/trends';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import TrendsCard from './TrendsCard';

interface Props {
  effects: SupplementEffectAvg[];
}

const DIMENSIONS: { key: keyof SupplementEffectAvg; label: string; color: string }[] = [
  { key: 'avgEnergy', label: 'Energy', color: '#f59e0b' },
  { key: 'avgFocus',  label: 'Focus',  color: '#3b82f6' },
  { key: 'avgSleep',  label: 'Sleep',  color: '#8b5cf6' },
  { key: 'avgMood',   label: 'Mood',   color: '#10b981' },
];

function DimBar({ value, color, styles }: { value: number | null; color: string; styles: ReturnType<typeof makeStyles> }) {
  if (value === null) return <View style={styles.dimBarEmpty} />;
  const width = `${Math.round((value / 5) * 100)}%` as `${number}%`;
  return (
    <View style={styles.dimBarTrack}>
      <View style={[styles.dimBarFill, { width, backgroundColor: color }]} />
    </View>
  );
}

function SupplementRow({ effect, styles }: { effect: SupplementEffectAvg; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.row}>
      <Text style={styles.suppName} numberOfLines={1}>{effect.name}</Text>
      <Text style={styles.suppCount}>{effect.count} ratings</Text>
      <View style={styles.dims}>
        {DIMENSIONS.map(({ key, label, color }) => (
          <View key={key} style={styles.dimRow}>
            <Text style={styles.dimLabel}>{label}</Text>
            <DimBar value={effect[key] as number | null} color={color} styles={styles} />
            <Text style={styles.dimValue}>
              {effect[key] !== null ? (effect[key] as number).toFixed(1) : '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function EffectsCard({ effects }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (effects.length === 0) {
    return (
      <TrendsCard label="Supplement Effects">
        <Text style={styles.empty}>
          After logging a dose, rate how you feel to see personalised effect data here.
          {'\n'}Requires at least 3 ratings per supplement.
        </Text>
      </TrendsCard>
    );
  }

  return (
    <TrendsCard label="Supplement Effects">
      <View style={styles.list}>
        {effects.map((e) => (
          <SupplementRow key={e.name} effect={e} styles={styles} />
        ))}
      </View>
    </TrendsCard>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    empty: {
      ...typography.bodySmall,
      color: c.text3,
      lineHeight: 20,
    },
    list: { gap: spacing.lg },
    row: { gap: spacing.xs },
    suppName: {
      ...typography.bodyStrong,
      color: c.text,
    },
    suppCount: {
      ...typography.caption,
      color: c.text3,
    },
    dims: { gap: spacing.xs, marginTop: spacing.xs },
    dimRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dimLabel: {
      ...typography.caption,
      color: c.text3,
      width: 44,
    },
    dimBarTrack: {
      flex: 1,
      height: 6,
      backgroundColor: c.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    dimBarFill: {
      height: 6,
      borderRadius: 3,
    },
    dimBarEmpty: {
      flex: 1,
      height: 6,
      backgroundColor: c.border,
      borderRadius: 3,
    },
    dimValue: {
      ...typography.caption,
      color: c.text2,
      fontWeight: '600',
      width: 28,
      textAlign: 'right',
    },
  });
}
