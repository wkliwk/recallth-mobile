import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { type JournalEntry, logJournal } from '../../services/journal';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface Props {
  token: string | null;
  existing: JournalEntry | null;
  onLogged: (entry: JournalEntry) => void;
}

const MOOD_OPTIONS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Low' },
  { value: 2, emoji: '😐', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'OK' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🤩', label: 'Great' },
];

const ENERGY_COLORS = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];

export function DailyCheckInCard({ token, existing, onLogged }: Props) {
  const [mood, setMood] = useState<number>(existing?.mood ?? 0);
  const [energy, setEnergy] = useState<number>(existing?.energy ?? 0);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(existing !== null);

  const canSubmit = mood > 0 && energy > 0 && !saving;

  const handleLog = async () => {
    if (!canSubmit || !token) return;
    setSaving(true);
    try {
      const entry = await logJournal(token, mood, energy, notes || undefined);
      setSaved(true);
      onLogged(entry);
    } catch {
      /* non-critical — user can retry */
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Daily Check-In</Text>

      {/* Mood row */}
      <Text style={styles.rowLabel}>Mood</Text>
      <View style={styles.moodRow}>
        {MOOD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => { setMood(opt.value); setSaved(false); }}
            style={[styles.moodBtn, mood === opt.value && styles.moodBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
          >
            <Text style={styles.moodEmoji}>{opt.emoji}</Text>
            <Text style={[styles.moodLabel, mood === opt.value && styles.moodLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Energy row */}
      <Text style={styles.rowLabel}>Energy</Text>
      <View style={styles.energyRow}>
        {[1, 2, 3, 4, 5].map((e) => (
          <Pressable
            key={e}
            onPress={() => { setEnergy(e); setSaved(false); }}
            style={[
              styles.energyBtn,
              energy === e && { backgroundColor: ENERGY_COLORS[e - 1], borderColor: ENERGY_COLORS[e - 1] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Energy level ${e}`}
          >
            <Text style={[styles.energyNum, energy === e && styles.energyNumActive]}>{e}</Text>
          </Pressable>
        ))}
        <Text style={styles.energyHint}>
          {energy === 0 ? 'low → high' : energy <= 2 ? 'Low' : energy === 3 ? 'Moderate' : 'High'}
        </Text>
      </View>

      {/* Notes */}
      <TextInput
        style={styles.notesInput}
        placeholder="Any notes? (optional)"
        placeholderTextColor={colors.text4}
        value={notes}
        onChangeText={(t) => { setNotes(t); setSaved(false); }}
        maxLength={500}
        returnKeyType="done"
      />

      {/* Submit */}
      <Pressable
        style={({ pressed }) => [
          styles.submitBtn,
          (!canSubmit || saved) && styles.submitBtnDisabled,
          pressed && { opacity: 0.85 },
        ]}
        onPress={() => { void handleLog(); }}
        disabled={!canSubmit || saved}
        accessibilityRole="button"
        accessibilityLabel={saved ? 'Logged today' : 'Log check-in'}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>{saved ? '✓ Logged today' : 'Log'}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.md,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text3,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  moodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: 9,
    color: colors.text3,
    marginTop: 2,
  },
  moodLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  energyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  energyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyNum: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text2,
  },
  energyNumActive: {
    color: '#fff',
  },
  energyHint: {
    fontSize: 11,
    color: colors.text3,
    marginLeft: spacing.xs,
    flex: 1,
  },
  notesInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.text,
    marginBottom: spacing.md,
    height: 40,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
