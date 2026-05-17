import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { type EffectRating } from '../../utils/effectsStorage';

const EMOJI_MAP: Record<number, string> = {
  [-2]: '😣',
  [-1]: '😕',
  [0]: '😐',
  [1]: '🙂',
  [2]: '😄',
};

const DOT_HEIGHT = 60;
const DOT_SIZE = 10;

interface SparklineProps {
  ratings: EffectRating[];
}

function Sparkline({ ratings }: SparklineProps) {
  const c = useThemeColors();
  const spark = useMemo(() => makeSparkStyles(c), [c]);

  const n = ratings.length;
  if (n < 2) return null;

  const segmentWidth = 100 / (n - 1);

  return (
    <View style={spark.container}>
      {ratings.map((r, i) => {
        // Map value (-2..2) to Y position (top=much better, bottom=much worse)
        const yPct = ((2 - r.value) / 4) * 100;
        return (
          <View
            key={r.weekKey}
            style={[
              spark.dot,
              {
                left: `${i * segmentWidth}%` as unknown as number,
                top: `${yPct}%` as unknown as number,
                backgroundColor: r.value >= 1 ? c.ok : r.value <= -1 ? c.danger : c.dim,
              },
            ]}
          >
            <Text style={spark.dotLabel}>{EMOJI_MAP[r.value] ?? '😐'}</Text>
          </View>
        );
      })}
      {/* Y-axis labels */}
      <Text style={[spark.axisLabel, { top: 0 }]}>Better</Text>
      <Text style={[spark.axisLabel, { bottom: 0 }]}>Worse</Text>
    </View>
  );
}

interface Props {
  supplementId: string;
  ratings: EffectRating[];
}

export function EffectsSection({ ratings }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (ratings.length < 2) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Keep tracking to see your effects over time.
          {'\n'}Rate weekly to build your personal timeline.
        </Text>
      </View>
    );
  }

  const latest = ratings[ratings.length - 1];

  return (
    <View>
      <View style={styles.latestRow}>
        <Text style={styles.latestEmoji}>{EMOJI_MAP[latest?.value ?? 0]}</Text>
        <View>
          <Text style={styles.latestLabel}>Latest: week of {latest?.weekKey ?? ''}</Text>
          {latest?.note ? <Text style={styles.latestNote}>{latest.note}</Text> : null}
        </View>
      </View>
      <Sparkline ratings={ratings} />
    </View>
  );
}

function makeSparkStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      height: DOT_HEIGHT,
      position: 'relative',
      marginVertical: spacing.md,
      marginHorizontal: spacing.sm,
    },
    dot: {
      position: 'absolute',
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      marginLeft: -(DOT_SIZE / 2),
      marginTop: -(DOT_SIZE / 2),
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotLabel: { fontSize: 14, position: 'absolute', top: -20 },
    axisLabel: {
      position: 'absolute',
      right: 0,
      fontSize: 9,
      color: c.text3,
      fontWeight: '500',
    },
  });
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    placeholder: {
      backgroundColor: c.bg,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    placeholderText: {
      ...typography.bodySmall,
      color: c.text3,
      textAlign: 'center',
      lineHeight: 18,
    },
    latestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    latestEmoji: { fontSize: 28 },
    latestLabel: { fontSize: 13, fontWeight: '600', color: c.text },
    latestNote: { ...typography.bodySmall, color: c.text2, marginTop: 2 },
  });
}
