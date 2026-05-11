import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../utils/theme';
import { type SupplementEntry } from './mockData';
import { SupplementRow } from './SupplementRow';

type ScheduleSectionProps = {
  label: string;
  items: SupplementEntry[];
  onToggle: (id: string) => void;
};

/**
 * A labelled time-block section (e.g. "Morning") containing supplement rows.
 * Renders nothing when the section has no items.
 */
export function ScheduleSection({ label, items, onToggle }: ScheduleSectionProps) {
  if (items.length === 0) return null;

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
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
});
