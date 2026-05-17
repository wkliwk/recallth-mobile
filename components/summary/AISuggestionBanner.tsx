import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

type AISuggestionBannerProps = {
  suggestion: string;
};

/**
 * Orange-tinted banner card displaying an AI-generated schedule suggestion.
 * Uses sparkle icon and primary orange accent per B·Health design.
 */
export function AISuggestionBanner({ suggestion }: AISuggestionBannerProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>✦</Text>
      </View>
      <Text style={styles.text} numberOfLines={3}>
        {suggestion}
      </Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    banner: {
      backgroundColor: c.primaryLight,
      borderWidth: 1,
      borderColor: `${c.primary}30`,
      borderRadius: radius.xl,
      padding: spacing.xl,
      marginBottom: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 1,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 1,
    },
    icon: {
      color: '#fff',
      fontSize: 14,
      lineHeight: 18,
    },
    text: {
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
      color: c.text,
    },
  });
}
