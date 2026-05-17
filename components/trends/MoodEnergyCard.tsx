import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type JournalEntry } from '../../services/journal';
import { ColorPalette, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import TrendsCard from './TrendsCard';

interface Props {
  entries: JournalEntry[];
}

const MOOD_EMOJIS = ['', '😞', '😐', '🙂', '😊', '🤩'];
const ENERGY_COLORS = ['', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];

interface DaySlot {
  date: string;
  weekday: string;
  entry: JournalEntry | null;
  isToday: boolean;
}

function buildSlots(entries: JournalEntry[]): DaySlot[] {
  const today = new Date();
  const byDate = new Map(entries.map((e) => [e.date, e]));
  const slots: DaySlot[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    slots.push({
      date: dateStr,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      entry: byDate.get(dateStr) ?? null,
      isToday: i === 0,
    });
  }

  return slots;
}

export default function MoodEnergyCard({ entries }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const slots = useMemo(() => buildSlots(entries), [entries]);
  const hasData = entries.length > 0;

  if (!hasData) return null;

  const avgMood = useMemo(() => {
    const logged = slots.filter((s) => s.entry !== null);
    if (logged.length === 0) return null;
    return Math.round(logged.reduce((sum, s) => sum + (s.entry?.mood ?? 0), 0) / logged.length * 10) / 10;
  }, [slots]);

  return (
    <TrendsCard label="Mood & Energy">
      {avgMood !== null && (
        <View style={styles.summaryRow}>
          <Text style={styles.avgEmoji}>{MOOD_EMOJIS[Math.round(avgMood)]}</Text>
          <View style={styles.avgInfo}>
            <Text style={styles.avgLabel}>Avg mood this week</Text>
            <Text style={styles.avgValue}>{avgMood} / 5</Text>
          </View>
        </View>
      )}

      {/* Day columns */}
      <View style={styles.grid}>
        {slots.map((slot) => (
          <View key={slot.date} style={styles.dayCol}>
            {/* Mood emoji */}
            <Text style={styles.moodEmoji}>
              {slot.entry ? MOOD_EMOJIS[slot.entry.mood] : '·'}
            </Text>

            {/* Energy dot */}
            <View
              style={[
                styles.energyDot,
                slot.entry
                  ? { backgroundColor: ENERGY_COLORS[slot.entry.energy] }
                  : styles.energyDotEmpty,
              ]}
            >
              {slot.entry && (
                <Text style={styles.energyNum}>{slot.entry.energy}</Text>
              )}
            </View>

            {/* Day label */}
            <Text style={[styles.dayLabel, slot.isToday && styles.dayLabelToday]}>
              {slot.weekday.slice(0, 1)}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendEmoji}>😊</Text>
        <Text style={styles.legendText}> Mood</Text>
        <View style={[styles.legendDot, { backgroundColor: ENERGY_COLORS[4] }]} />
        <Text style={styles.legendText}> Energy</Text>
      </View>
    </TrendsCard>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
    },
    avgEmoji: {
      fontSize: 36,
    },
    avgInfo: {
      gap: 2,
    },
    avgLabel: {
      fontSize: 12,
      color: c.text3,
    },
    avgValue: {
      ...typography.bodyStrong,
      fontSize: 16,
      color: c.text,
    },
    grid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    dayCol: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    moodEmoji: {
      fontSize: 18,
      lineHeight: 22,
    },
    energyDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    energyDotEmpty: {
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
    },
    energyNum: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
    },
    dayLabel: {
      ...typography.caption,
      color: c.text3,
    },
    dayLabelToday: {
      color: c.primaryBright,
      fontWeight: '700',
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    legendEmoji: {
      fontSize: 14,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginLeft: spacing.md,
    },
    legendText: {
      fontSize: 11,
      color: c.text3,
    },
  });
}
