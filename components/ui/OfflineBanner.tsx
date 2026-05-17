import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../utils/theme';

interface Props {
  visible: boolean;
}

export function OfflineBanner({ visible }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.text}>Offline — syncing when connected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.text3,
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
