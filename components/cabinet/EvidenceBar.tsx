import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../utils/theme';

type EvidenceLevel = 'High' | 'Moderate' | 'Limited';

interface EvidenceBarProps {
  level: EvidenceLevel;
  pct: number;
}

function barColor(level: EvidenceLevel): string {
  if (level === 'High') return colors.ok;
  if (level === 'Moderate') return colors.primary;
  return colors.warning;
}

export function EvidenceBar({ level, pct }: EvidenceBarProps) {
  const color = barColor(level);
  const clampedPct = Math.min(100, Math.max(0, pct));

  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${clampedPct}%` as `${number}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={styles.label}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  track: {
    flex: 1,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text2,
    minWidth: 56,
    textAlign: 'right',
  },
});
