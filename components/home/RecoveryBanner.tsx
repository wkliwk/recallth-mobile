import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  onRecover: () => void;
  onDismiss: () => void;
}

function RecoveryBannerInner({ onRecover, onDismiss }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Recover yesterday's doses?</Text>
        <Text style={styles.subtitle}>Log them now to keep your streak alive.</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onRecover}
          style={({ pressed }) => [styles.recoverBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Recover yesterday's doses"
        >
          <Text style={styles.recoverText}>Recover →</Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss recovery banner"
        >
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const RecoveryBanner = memo(RecoveryBannerInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      marginHorizontal: spacing.screenPad,
      marginBottom: spacing.md,
      backgroundColor: c.warningLight,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.warning,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    content: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.bodyStrong,
      color: c.warning,
    },
    subtitle: {
      ...typography.caption,
      color: c.text2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
    },
    recoverBtn: {
      backgroundColor: c.warning,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    recoverText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },
    dismissBtn: {
      padding: spacing.xs,
    },
    dismissText: {
      fontSize: 14,
      color: c.text3,
    },
  });
}
