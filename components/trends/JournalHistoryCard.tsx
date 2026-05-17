import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { JournalEntry } from '../../services/journal';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😔', 2: '😕', 3: '😐', 4: '😊', 5: '😄',
};

const ENERGY_LABELS: Record<number, string> = {
  1: 'Very low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very high',
};

interface Props {
  entries: JournalEntry[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function JournalHistoryCard({ entries }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const sorted = entries
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Journal</Text>
      <Text style={styles.cardSubtitle}>Last 14 days of daily check-ins</Text>

      {sorted.length < 2 ? (
        <Text style={styles.empty}>
          Log your mood and energy daily from the Home screen to see your journal history here.
        </Text>
      ) : (
        sorted.map((entry) => (
          <View key={entry._id} style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
              <View style={styles.scoresRow}>
                <Text style={styles.moodEmoji}>{MOOD_EMOJIS[entry.mood] ?? '😐'}</Text>
                <Text style={styles.energyLabel}>Energy: {ENERGY_LABELS[entry.energy] ?? entry.energy}</Text>
              </View>
              {entry.notes ? (
                <Text style={styles.notes}>{entry.notes}</Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.screenPad,
      marginBottom: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.lg,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
      marginBottom: 2,
    },
    cardSubtitle: {
      ...typography.caption,
      color: c.text3,
      marginBottom: spacing.lg,
    },
    empty: {
      ...typography.bodySmall,
      color: c.text3,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    row: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    rowLeft: { gap: 4 },
    dateText: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: c.text,
    },
    scoresRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    moodEmoji: { fontSize: 16 },
    energyLabel: {
      ...typography.caption,
      color: c.text2,
    },
    notes: {
      ...typography.bodySmall,
      color: c.text2,
      marginTop: 2,
      lineHeight: 18,
    },
  });
}
