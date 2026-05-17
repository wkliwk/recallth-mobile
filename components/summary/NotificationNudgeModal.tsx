import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  visible: boolean;
  onSure: () => void;
  onNotNow: () => void;
}

export function NotificationNudgeModal({ visible, onSure, onNotNow }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNotNow}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={styles.title}>Want a daily reminder?</Text>
          <Text style={styles.body}>
            We'll remind you when it's time to take your supplements so you never miss a dose.
          </Text>
          <Pressable
            onPress={onSure}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Enable daily reminders"
          >
            <Text style={styles.primaryBtnText}>Sure, remind me</Text>
          </Pressable>
          <Pressable
            onPress={onNotNow}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Skip notifications for now"
          >
            <Text style={styles.secondaryBtnText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingBottom: spacing.xxxl,
      paddingHorizontal: spacing.screenPad,
    },
    sheet: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      padding: spacing.xl,
      width: '100%',
      alignItems: 'center',
      gap: spacing.md,
    },
    icon: { fontSize: 36 },
    title: {
      ...typography.pageTitle,
      fontSize: 20,
      color: c.text,
      textAlign: 'center',
    },
    body: {
      ...typography.body,
      color: c.text2,
      textAlign: 'center',
      lineHeight: 22,
    },
    primaryBtn: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      height: 52,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    primaryBtnText: { ...typography.cta, color: '#fff' },
    secondaryBtn: {
      paddingVertical: spacing.sm,
      width: '100%',
      alignItems: 'center',
    },
    secondaryBtnText: { ...typography.body, color: c.text3 },
  });
}
