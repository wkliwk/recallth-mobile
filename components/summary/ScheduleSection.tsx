import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { type SupplementEntry } from './mockData';
import { SupplementRow } from './SupplementRow';

type ScheduleSectionProps = {
  label: string;
  items: SupplementEntry[];
  onToggle: (id: string) => void;
  onLogAll?: () => void;
  onSwipeLog?: (id: string) => void;
  onSwipeUnlog?: (id: string) => void;
};

/**
 * A labelled time-block section (e.g. "Morning") containing supplement rows.
 * Renders nothing when the section has no items.
 */
export function ScheduleSection({ label, items, onToggle, onLogAll, onSwipeLog, onSwipeUnlog }: ScheduleSectionProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  if (items.length === 0) return null;

  const unloggedCount = items.filter((s) => !s.taken).length;
  const hasUnlogged = unloggedCount > 0;
  const isPartial = hasUnlogged && unloggedCount < items.length;
  const logAllLabel = isPartial ? `Log remaining (${unloggedCount})` : 'Log all';

  return (
    <View>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {hasUnlogged && onLogAll && (
          <Pressable
            onPress={onLogAll}
            style={({ pressed }) => [styles.logAllBtn, isPartial && styles.logAllBtnPartial, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={`${logAllLabel} ${label} supplements`}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.logAllText}>{logAllLabel}</Text>
          </Pressable>
        )}
        {!hasUnlogged && items.length > 1 && (
          <Text style={styles.allDoneLabel}>All done ✓</Text>
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
          onSwipeLog={onSwipeLog ? () => onSwipeLog(item.id) : undefined}
          onSwipeUnlog={onSwipeUnlog ? () => onSwipeUnlog(item.id) : undefined}
        />
      ))}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    backgroundColor: c.bg,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  sectionLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: c.text,
  },
  logAllBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: c.primaryLight,
    borderWidth: 1,
    borderColor: c.primary + '40',
  },
  logAllBtnPartial: {
    backgroundColor: c.warningLight,
    borderColor: c.warning + '50',
  },
  logAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: c.primary,
  },
  allDoneLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: c.ok,
  },
});}
