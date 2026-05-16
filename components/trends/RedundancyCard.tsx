import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { type Redundancy, type RedundancyRisk } from '../../services/cabinet';
import { colors, radius, spacing } from '../../utils/theme';
import TrendsCard from './TrendsCard';

function riskColor(risk: RedundancyRisk): string {
  if (risk === 'high') return colors.danger;
  if (risk === 'moderate') return colors.warning;
  return colors.text2;
}

function riskBg(risk: RedundancyRisk): string {
  if (risk === 'high') return colors.dangerLight;
  if (risk === 'moderate') return colors.warningLight;
  return colors.surface;
}

interface Props {
  redundancies: Redundancy[];
}

export default function RedundancyCard({ redundancies }: Props) {
  if (redundancies.length === 0) return null;

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

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
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
    color: colors.text2,
    marginBottom: spacing.xs,
  },
  explanation: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  recommendation: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    lineHeight: 17,
  },
});
