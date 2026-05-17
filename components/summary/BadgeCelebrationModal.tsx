import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Clipboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { type BadgeDef } from '../../utils/badges';

interface Props {
  badge: BadgeDef | null;
  onDismiss: () => void;
}

const CONFETTI_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];
const CONFETTI_COUNT = 24;

function Confetti() {
  const anims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => {
      const xPct = Math.random();
      return {
        xPct,
        x: new Animated.Value(xPct),
        y: new Animated.Value(0),
        rot: new Animated.Value(0),
      };
    }),
  ).current;

  useEffect(() => {
    const animations = anims.map(({ y, rot }) =>
      Animated.parallel([
        Animated.timing(y, { toValue: 1, duration: 1800 + Math.random() * 800, useNativeDriver: true }),
        Animated.timing(rot, { toValue: 1, duration: 1400 + Math.random() * 600, useNativeDriver: true }),
      ]),
    );
    Animated.stagger(40, animations).start();
  }, [anims]);

  return (
    <>
      {anims.map((anim, i) => {
        const left = `${Math.round(anim.xPct * 100)}%` as `${number}%`;
        const translateY = anim.y.interpolate({ inputRange: [0, 1], outputRange: [-20, 500] });
        const rotate = anim.rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 360 : -360}deg`] });
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        return (
          <Animated.View
            key={i}
            style={[
              confettiStyles.confettiPiece,
              { left, backgroundColor: color, transform: [{ translateY }, { rotate }] },
            ]}
          />
        );
      })}
    </>
  );
}

const confettiStyles = StyleSheet.create({
  confettiPiece: {
    position: 'absolute',
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});

function BadgeCelebrationModalInner({ badge, onDismiss }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const handleCopyShare = useCallback(() => {
    if (badge?.shareText) {
      Clipboard.setString(badge.shareText);
    }
  }, [badge]);

  if (!badge) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Confetti />
        <View style={styles.card}>
          <Text style={styles.icon}>{badge.icon}</Text>
          <Text style={styles.title}>{badge.label}</Text>
          <Text style={styles.description}>{badge.description}</Text>
          <Pressable
            onPress={handleCopyShare}
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Copy share text to clipboard"
          >
            <Text style={styles.shareBtnText}>📋 Copy share text</Text>
          </Pressable>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Keep it up — close celebration"
          >
            <Text style={styles.dismissBtnText}>Keep it up →</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export const BadgeCelebrationModal = memo(BadgeCelebrationModalInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.screenPad,
      overflow: 'hidden',
    },
    card: {
      width: '100%',
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.xxl,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
      gap: spacing.md,
    },
    icon: {
      fontSize: 60,
      lineHeight: 68,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: c.text2,
      textAlign: 'center',
      lineHeight: 20,
    },
    shareBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xs,
    },
    shareBtnText: {
      fontSize: 13,
      color: c.text2,
    },
    dismissBtn: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      width: '100%',
      alignItems: 'center',
    },
    dismissBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });
}
