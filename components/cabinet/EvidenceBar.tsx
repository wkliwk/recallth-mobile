import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColorPalette, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

type EvidenceLevel = 'High' | 'Moderate' | 'Limited';

interface EvidenceBarProps {
  level: EvidenceLevel;
  pct: number;
}

function barColor(level: EvidenceLevel, c: ColorPalette): string {
  if (level === 'High') return c.ok;
  if (level === 'Moderate') return c.primary;
  return c.warning;
}

export function EvidenceBar({ level, pct }: EvidenceBarProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const color = barColor(level, c);
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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  track: {
    flex: 1,
    height: 5,
    backgroundColor: c.border,
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
    color: c.text2,
    minWidth: 56,
    textAlign: 'right',
  },
});}
