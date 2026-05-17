import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../utils/theme';
import { useThemeColors } from '../utils/useTheme';

type StatTileProps = {
  value: string | number;
  label: string;
  /** Accent color for the value. Defaults to theme primary. */
  valueColor?: string;
  /** Optional surface background color override (e.g. warning-light for alerts). */
  bgColor?: string;
  /** Optional border color override. */
  borderColor?: string;
};

export function StatTile({
  value,
  label,
  valueColor,
  bgColor,
  borderColor,
}: StatTileProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  // Resolve defaults from theme at render time
  const resolvedValueColor = valueColor ?? c.primary;
  const resolvedBgColor = bgColor ?? c.surface;
  const resolvedBorderColor = borderColor ?? c.border;

  return (
    <View style={[styles.tile, { backgroundColor: resolvedBgColor, borderColor: resolvedBorderColor }]}>
      <Text style={[styles.value, { color: resolvedValueColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    tile: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.xl,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      // Card elevation shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    value: {
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '800',
    },
    label: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '500',
      color: c.text3,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
  });
}
