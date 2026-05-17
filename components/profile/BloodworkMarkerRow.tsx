import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import type { BloodworkEntry } from '../../services/bloodwork';

type Status = 'above_range' | 'below_range' | 'in_range' | 'unknown';

function deriveStatus(e: BloodworkEntry): Status {
  if (e.refLow == null && e.refHigh == null) return 'unknown';
  if (e.refHigh != null && e.value > e.refHigh) return 'above_range';
  if (e.refLow != null && e.value < e.refLow) return 'below_range';
  return 'in_range';
}

const STATUS_LABEL: Record<Status, string> = {
  above_range: 'High',
  below_range: 'Low',
  in_range: 'Normal',
  unknown: '—',
};

interface Props {
  entry: BloodworkEntry;
}

export function BloodworkMarkerRow({ entry }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const STATUS_COLOR: Record<Status, string> = {
    above_range: c.danger,
    below_range: c.warning,
    in_range: c.ok,
    unknown: c.text3,
  };

  const STATUS_BG: Record<Status, string> = {
    above_range: c.dangerLight,
    below_range: c.warningLight,
    in_range: '#edf8f1',
    unknown: c.bg,
  };

  const status = deriveStatus(entry);
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.marker}>{entry.marker}</Text>
        <Text style={styles.meta}>
          {entry.date}
          {entry.refLow != null || entry.refHigh != null
            ? ` · ref ${entry.refLow ?? '?'}–${entry.refHigh ?? '?'} ${entry.unit}`
            : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.value}>
          {entry.value} <Text style={styles.unit}>{entry.unit}</Text>
        </Text>
        <View style={[styles.badge, { backgroundColor: STATUS_BG[status] }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    left: { flex: 1, paddingRight: spacing.sm },
    marker: { fontSize: 14, fontWeight: '600', color: c.text },
    meta: { fontSize: 11, color: c.text3, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: 4 },
    value: { fontSize: 14, fontWeight: '600', color: c.text },
    unit: { fontSize: 12, fontWeight: '400', color: c.text2 },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },
  });
}
