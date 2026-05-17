import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type Redundancy, type RedundancyRisk } from '../../services/cabinet';
import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import TrendsCard from './TrendsCard';

interface Props {
  redundancies: Redundancy[];
}

export default function RedundancyCard({ redundancies }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (redundancies.length === 0) return null;

  function riskColor(risk: RedundancyRisk): string {
    if (risk === 'high') return c.danger;
    if (risk === 'moderate') return c.warning;
    return c.text2;
  }

  function riskBg(risk: RedundancyRisk): string {
    if (risk === 'high') return c.dangerLight;
    if (risk === 'moderate') return c.warningLight;
    return c.surface;
  }

  return (
    <TrendsCard label="Redundancy Check">
      {redundancies.map((r, i) => (
        <View
          key={`${r.nutrient}-${i}`}
          style={[styles.row, i < redundancies.length - 1 && styles.rowBorder]}
        >
          <View style={styles.header}>
            <Text style={styles.nutrient}>{r.nutrient}</Text>
            <View style={[styles.riskPill, { backgroundColor: riskBg(r.risk) }]}>
              <Text style={[styles.riskText, { color: riskColor(r.risk) }]}>
                {r.risk.charAt(0).toUpperCase() + r.risk.slice(1)}
              </Text>
            </View>
          </View>
          <Text style={styles.items}>{r.items.join(' + ')}</Text>
          <Text style={styles.explanation}>{r.explanation}</Text>
          <Text style={styles.recommendation}>→ {r.recommendation}</Text>
        </View>
      ))}
    </TrendsCard>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      paddingVertical: spacing.md,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    nutrient: {
      fontSize: 14,
      fontWeight: '700',
      color: c.text,
      flex: 1,
    },
    riskPill: {
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    riskText: {
      fontSize: 11,
      fontWeight: '600',
    },
    items: {
      fontSize: 12,
      color: c.text2,
      marginBottom: spacing.xs,
    },
    explanation: {
      fontSize: 13,
      color: c.text,
      lineHeight: 18,
      marginBottom: spacing.xs,
    },
    recommendation: {
      fontSize: 12,
      color: c.primary,
      fontWeight: '500',
      lineHeight: 17,
    },
  });
}
