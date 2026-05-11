import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

type SupplementRowProps = {
  name: string;
  dose: string;
  taken: boolean;
  isLast: boolean;
  onToggle: () => void;
};

/**
 * Single supplement row inside a time-block section.
 * Displays name, dose, and a tappable checkbox to toggle taken state.
 */
export function SupplementRow({ name, dose, taken, isLast, onToggle }: SupplementRowProps) {
  return (
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
    color: colors.text,
  },
  nameTaken: {
    color: colors.text3,
    textDecorationLine: 'line-through',
  },
  dose: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text2,
  },
});
