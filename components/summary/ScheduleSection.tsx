import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';
import { type SupplementEntry } from './mockData';
import { SupplementRow } from './SupplementRow';

type ScheduleSectionProps = {
  label: string;
  items: SupplementEntry[];
  onToggle: (id: string) => void;
  onLogAll?: () => void;
};

/**
 * A labelled time-block section (e.g. "Morning") containing supplement rows.
 * Renders nothing when the section has no items.
 */
export function ScheduleSection({ label, items, onToggle, onLogAll }: ScheduleSectionProps) {
  if (items.length === 0) return null;

  const hasUnlogged = items.some((s) => !s.taken);

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {hasUnlogged && onLogAll && (
          <Pressable
            onPress={onLogAll}
            style={({ pressed }) => [styles.logAllBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={`Log all ${label} supplements`}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.logAllText}>Log all</Text>
          </Pressable>
        )}
      </View>

      {/* Supplement rows */}
      {items.map((item, index) => (
        <SupplementRow
          key={item.id}
          name={item.name}
          dose={item.dose}
          taken={item.taken}
          isLast={index === items.length - 1}
          onToggle={() => onToggle(item.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.text,
  },
  logAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  logAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
