import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Haptics from 'expo-haptics';

import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

type SupplementRowProps = {
  name: string;
  dose: string;
  taken: boolean;
  isLast: boolean;
  onToggle: () => void;
  onSwipeLog?: () => void;
  onSwipeUnlog?: () => void;
};

function SwipeLogAction() {
  const c = useThemeColors();
  return (
    <View style={{ backgroundColor: c.primary, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: spacing.xl, flex: 1 }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>✓ Log</Text>
    </View>
  );
}

function SwipeUnlogAction() {
  const c = useThemeColors();
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'flex-start', paddingHorizontal: spacing.xl, flex: 1 }}>
      <Text style={{ color: c.text2, fontWeight: '700', fontSize: 14 }}>↩ Undo</Text>
    </View>
  );
}

export function SupplementRow({ name, dose, taken, isLast, onToggle, onSwipeLog, onSwipeUnlog }: SupplementRowProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    swipeableRef.current?.close();
    if (direction === 'right' && !taken && onSwipeLog) {
      onSwipeLog();
    } else if (direction === 'left' && taken && onSwipeUnlog) {
      onSwipeUnlog();
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={60}
      rightThreshold={60}
      overshootLeft={false}
      overshootRight={false}
      renderRightActions={taken && onSwipeUnlog ? () => <SwipeUnlogAction /> : undefined}
      renderLeftActions={!taken && onSwipeLog ? () => <SwipeLogAction /> : undefined}
      onSwipeableOpen={handleSwipeOpen}
    >
      <View style={[styles.row, !isLast && styles.rowBorder]}>
        {/* Checkbox */}
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [
            styles.checkbox,
            taken && styles.checkboxChecked,
            pressed && styles.checkboxPressed,
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: taken }}
          accessibilityLabel={`Mark ${name} as ${taken ? 'not taken' : 'taken'}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {taken && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        {/* Name + dose */}
        <View style={styles.info}>
          <Text
            style={[styles.name, taken && styles.nameTaken]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={styles.dose} numberOfLines={1}>
            {dose}
          </Text>
        </View>
      </View>
    </Swipeable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    backgroundColor: c.surface,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  checkboxPressed: {
    opacity: 0.7,
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: c.text,
  },
  nameTaken: {
    color: c.text3,
    textDecorationLine: 'line-through',
  },
  dose: {
    fontSize: 12,
    lineHeight: 16,
    color: c.text2,
  },
});}
