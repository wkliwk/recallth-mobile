import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  label: string;
  children: ReactNode;
}

/** Shared card chrome for Trends sections — matches Summary `DoseProgressCard`. */
export default function TrendsCard({ label, children }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      {children}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.cardSolid,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.xl,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    cardLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: c.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: spacing.sm,
    },
  });
}
