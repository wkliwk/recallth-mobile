import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { type SupplementEntry, type TimeBlock } from './mockData';

const BLOCK_HOURS: Record<TimeBlock, number> = {
  morning: 8,
  midday: 12,
  evening: 18,
  night: 22,
};

const LATE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

interface MissedChip {
  id: string;
  name: string;
  scheduledHour: number;
}

interface Props {
  supplements: SupplementEntry[];
  dismissed: string[];
  onLogLate: (id: string) => void;
  onDismiss: (id: string) => void;
}

function MissedDoseChipsInner({ supplements, dismissed, onLogLate, onDismiss }: Props) {
  const now = new Date();
  const nowMs = now.getTime();

  const missed: MissedChip[] = useMemo(() => {
    return supplements
      .filter((s) => {
        if (s.taken) return false;
        if (dismissed.includes(s.id)) return false;
        const blockHour = BLOCK_HOURS[s.timeBlock];
        const blockDate = new Date(now);
        blockDate.setHours(blockHour, 0, 0, 0);
        return nowMs - blockDate.getTime() > LATE_THRESHOLD_MS;
      })
      .map((s) => ({ id: s.id, name: s.name, scheduledHour: BLOCK_HOURS[s.timeBlock] }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplements, dismissed, nowMs]);

  if (missed.length === 0) return null;

  return (
    <View style={styles.container}>
      {missed.map((chip) => (
        <ChipRow
          key={chip.id}
          chip={chip}
          onLogLate={onLogLate}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
}

function ChipRow({
  chip,
  onLogLate,
  onDismiss,
}: {
  chip: MissedChip;
  onLogLate: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const timeLabel = chip.scheduledHour < 12
    ? `${chip.scheduledHour}:00 AM`
    : chip.scheduledHour === 12
    ? '12:00 PM'
    : `${chip.scheduledHour - 12}:00 PM`;

  const handleLog = useCallback(() => onLogLate(chip.id), [chip.id, onLogLate]);
  const handleDismiss = useCallback(() => onDismiss(chip.id), [chip.id, onDismiss]);

  return (
    <View style={styles.chip}>
      <View style={styles.chipLeft}>
        <Text style={styles.chipLabel}>Missed at {timeLabel}</Text>
        <Text style={styles.chipName} numberOfLines={1}>{chip.name}</Text>
      </View>
      <View style={styles.chipActions}>
        <Pressable
          onPress={handleLog}
          style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel={`Log ${chip.name} late`}
        >
          <Text style={styles.logBtnText}>Log late</Text>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss missed dose for ${chip.name}`}
          style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const MissedDoseChips = memo(MissedDoseChipsInner);

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warningMid,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  chipLeft: { flex: 1, gap: 2 },
  chipLabel: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipName: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  chipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logBtn: {
    backgroundColor: colors.warning,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  logBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  dismissBtn: {},
  dismissText: {
    fontSize: 13,
    color: colors.text3,
  },
});
