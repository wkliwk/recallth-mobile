import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ColorPalette, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  visible: boolean;
}

export function OfflineBanner({ visible }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (!visible) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.text}>Offline — syncing when connected</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    banner: {
      backgroundColor: c.text3,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    text: {
      ...typography.caption,
      color: '#fff',
      fontWeight: '600',
      letterSpacing: 0.2,
    },
  });
}
