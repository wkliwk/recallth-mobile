import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface Props {
  message: string;
  onUndo: () => void;
  onExpire: () => void;
  durationMs?: number;
}

export function UndoToast({ message, onUndo, onExpire, durationMs = 3000 }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const expiredRef = useRef(false);

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      if (!expiredRef.current) {
        expiredRef.current = true;
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          onExpire();
        });
      }
    }, durationMs);

    return () => clearTimeout(timer);
  }, []);

  const handleUndo = () => {
    if (expiredRef.current) return;
    expiredRef.current = true;
    Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      onUndo();
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="box-none">
      <View style={styles.toast}>
        <Text style={styles.message} numberOfLines={1}>{message}</Text>
        <Pressable
          onPress={handleUndo}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Undo batch log"
        >
          <Text style={styles.undoBtn}>Undo</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: spacing.screenPad,
    right: spacing.screenPad,
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    ...typography.bodySmall,
    color: '#fff',
    flex: 1,
  },
  undoBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
