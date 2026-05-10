import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../utils/theme';

type StatTileProps = {
  value: string | number;
  label: string;
  /** Accent color for the value. Defaults to primary green. */
  valueColor?: string;
  /** Optional surface background color override (e.g. warning-light for alerts). */
  bgColor?: string;
  /** Optional border color override. */
  borderColor?: string;
};

export function StatTile({
  value,
  label,
  valueColor = colors.primary,
  bgColor = colors.surface,
  borderColor = colors.border,
}: StatTileProps) {
  return (
    <View style={[styles.tile, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.value, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Card elevation shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  value: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
