/**
 * FAB — floating action button.
 *
 * Design system:
 *   Cabinet: 58×58, radius 18, green gradient, anchored bottom-right.
 *   Chat: purple gradient variant.
 * Shadow: fab-green / fab-purple.
 */

import React, { useMemo } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

type FABVariant = 'green' | 'purple';

type Props = {
  onPress: () => void;
  variant?: FABVariant;
  accessibilityLabel?: string;
  icon?: string;
};

export function FAB({ onPress, variant = 'green', accessibilityLabel = 'Add', icon = '+' }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const VARIANT_COLORS: Record<FABVariant, { start: string; shadow: string }> = {
    green: {
      start: c.primary,
      shadow: 'rgba(5,150,105,0.30)',
    },
    purple: {
      start: c.ai,
      shadow: 'rgba(124,58,237,0.30)',
    },
  };

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

function makeStyles(_c: ColorPalette) {
  return StyleSheet.create({
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
}
