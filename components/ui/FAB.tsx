/**
 * FAB — floating action button.
 *
 * Design system:
 *   Cabinet: 58×58, radius 18, green gradient, anchored bottom-right.
 *   Chat: purple gradient variant.
 * Shadow: fab-green / fab-purple.
 */

import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../utils/theme';

type FABVariant = 'green' | 'purple';

type Props = {
  onPress: () => void;
  variant?: FABVariant;
  accessibilityLabel?: string;
  icon?: string;
};

const VARIANT_COLORS: Record<FABVariant, { start: string; end: string; shadow: string }> = {
  green: {
    start: colors.primary,
    end: colors.primaryBright,
    shadow: 'rgba(5,150,105,0.30)',
  },
  purple: {
    start: colors.ai,
    end: colors.aiDeep,
    shadow: 'rgba(124,58,237,0.30)',
  },
};

export function FAB({ onPress, variant = 'green', accessibilityLabel = 'Add', icon = '+' }: Props) {
  const { start, shadow } = VARIANT_COLORS[variant];
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30 }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.fab, { backgroundColor: start, shadowColor: shadow }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.fabInner}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 108,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  fabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
    includeFontPadding: false,
  },
});
