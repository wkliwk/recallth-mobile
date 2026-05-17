import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
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

function ChipRow({
  chip,
  onLogLate,
  onDismiss,
  styles,
}: {
  chip: MissedChip;
  onLogLate: (id: string) => void;
  onDismiss: (id: string) => void;
  styles: ReturnType<typeof makeStyles>;
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

function MissedDoseChipsInner({ supplements, dismissed, onLogLate, onDismiss }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

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
          styles={styles}
        />
      ))}
    </View>
  );
}

export const MissedDoseChips = memo(MissedDoseChipsInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
      marginBottom: 14,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.warningLight,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.warningMid,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    chipLeft: { flex: 1, gap: 2 },
    chipLabel: {
      ...typography.caption,
      color: c.warning,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    chipName: {
      ...typography.bodyStrong,
      color: c.text,
    },
    chipActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    logBtn: {
      backgroundColor: c.warning,
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
      color: c.text3,
    },
  });
}
