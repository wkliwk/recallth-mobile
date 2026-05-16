import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getSettings,
  patchSettings,
  type DigestDay,
  type UserSettings,
} from '../../services/settings';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

const DIGEST_DAYS: DigestDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<DigestDay, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const DEFAULT_SETTINGS: UserSettings = {
  remindersEnabled: false,
  reminderTimes: [],
  timezone: 'UTC',
  emailDigestEnabled: false,
  emailDigestDay: 'sunday',
};

function isValidTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export default function SettingsScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('');
  const [timeError, setTimeError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const s = await getSettings(token);
      setSettings(s);
    } catch {
      /* use defaults */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (update: Partial<UserSettings>) => {
    if (!token) return;
    setSaving(true);
    setSaveMsg(null);
    const next = { ...settings, ...update };
    setSettings(next);
    try {
      await patchSettings(token, update);
      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setSaveMsg('Save failed');
      setTimeout(() => setSaveMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }, [token, settings]);

  const addTime = () => {
    if (!isValidTime(newTime)) {
      setTimeError('Use HH:MM format (e.g. 08:00)');
      return;
    }
    if (settings.reminderTimes.includes(newTime)) {
      setTimeError('Time already added');
      return;
    }
    setTimeError(null);
    const times = [...settings.reminderTimes, newTime].sort();
    setNewTime('');
    void save({ reminderTimes: times });
  };

  const removeTime = (t: string) => {
    const times = settings.reminderTimes.filter((x) => x !== t);
    void save({ reminderTimes: times });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Reminders section */}
          <Text style={styles.sectionLabel}>Dose Reminders</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Enable reminders</Text>
              <Switch
                value={settings.remindersEnabled}
                onValueChange={(v) => { void save({ remindersEnabled: v }); }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {settings.remindersEnabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.subLabel}>Reminder times</Text>
                {settings.reminderTimes.map((t) => (
                  <View key={t} style={styles.timeRow}>
                    <Text style={styles.timeText}>{t}</Text>
                    <Pressable
                      onPress={() => removeTime(t)}
                      style={({ pressed }) => [styles.removeTimeBtn, pressed && { opacity: 0.7 }]}
                      accessibilityLabel={`Remove ${t}`}
                    >
                      <Text style={styles.removeTimeBtnText}>✕</Text>
                    </Pressable>
                  </View>
                ))}
                <View style={styles.addTimeRow}>
                  <TextInput
                    style={[styles.timeInput, timeError ? styles.timeInputError : null]}
                    value={newTime}
                    onChangeText={(t) => { setNewTime(t); setTimeError(null); }}
                    placeholder="08:00"
                    placeholderTextColor={colors.text4}
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                  />
                  <Pressable
                    onPress={addTime}
                    style={({ pressed }) => [styles.addTimeBtn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Add time"
                  >
                    <Text style={styles.addTimeBtnText}>Add</Text>
                  </Pressable>
                </View>
                {timeError && <Text style={styles.timeErrorText}>{timeError}</Text>}
              </>
            )}
          </View>

          {/* Email digest section */}
          <Text style={styles.sectionLabel}>Weekly Email Digest</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Enable weekly digest</Text>
              <Switch
                value={settings.emailDigestEnabled}
                onValueChange={(v) => { void save({ emailDigestEnabled: v }); }}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {settings.emailDigestEnabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.subLabel}>Send on</Text>
                <View style={styles.dayRow}>
                  {DIGEST_DAYS.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => { void save({ emailDigestDay: day }); }}
                      style={[styles.dayBtn, settings.emailDigestDay === day && styles.dayBtnActive]}
                      accessibilityRole="button"
                      accessibilityLabel={day}
                    >
                      <Text style={[styles.dayBtnText, settings.emailDigestDay === day && styles.dayBtnTextActive]}>
                        {DAY_LABELS[day]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Save status */}
          {saveMsg !== null && (
            <Text style={[styles.saveMsg, saveMsg === 'Saved' ? styles.saveMsgOk : styles.saveMsgErr]}>
              {saveMsg}
            </Text>
          )}
          {saving && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  title: { ...typography.pageTitle, color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 15, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text3,
    marginBottom: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  timeText: { fontSize: 15, color: colors.text, fontFamily: 'monospace' },
  removeTimeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTimeBtnText: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  addTimeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  timeInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    fontFamily: 'monospace',
  },
  timeInputError: { borderColor: colors.danger },
  addTimeBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTimeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  timeErrorText: { fontSize: 12, color: colors.danger, marginTop: spacing.xs },
  dayRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  dayBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dayBtnText: { fontSize: 13, color: colors.text2, fontWeight: '500' },
  dayBtnTextActive: { color: colors.primary, fontWeight: '700' },
  saveMsg: { fontSize: 13, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
  saveMsgOk: { color: colors.ok },
  saveMsgErr: { color: colors.danger },
});
