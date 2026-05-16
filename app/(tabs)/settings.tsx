import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getSettings,
  patchSettings,
  type DigestDay,
  type UserSettings,
} from '../../services/settings';
import {
  cancelAllReminders,
  requestPermissions,
  scheduleDailyReminders,
} from '../../services/notifications';
import { deleteAccount } from '../../services/auth';
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

function formatHHMM(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });

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

      const remindersEnabled = next.remindersEnabled;
      const times = next.reminderTimes;

      if (remindersEnabled && times.length > 0) {
        const status = await requestPermissions();
        if (status === 'granted') {
          await scheduleDailyReminders(times);
        } else if (status === 'denied') {
          Alert.alert(
            'Notifications blocked',
            'Enable notifications for Recallth in Settings to receive dose reminders.',
          );
        }
      } else {
        await cancelAllReminders();
      }

      setSaveMsg('Saved');
      setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setSaveMsg('Save failed');
      setTimeout(() => setSaveMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }, [token, settings]);

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setPickerVisible(false);
      if (event.type === 'dismissed' || !date) return;
      addTimeFromDate(date);
    } else {
      if (date) setPickerDate(date);
    }
  };

  const addTimeFromDate = (date: Date) => {
    const timeStr = formatHHMM(date);
    if (settings.reminderTimes.includes(timeStr)) return;
    const times = [...settings.reminderTimes, timeStr].sort();
    void save({ reminderTimes: times });
  };

  const confirmIOSPicker = () => {
    setPickerVisible(false);
    addTimeFromDate(pickerDate);
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

                <Pressable
                  onPress={() => {
                    const d = new Date();
                    d.setHours(9, 0, 0, 0);
                    setPickerDate(d);
                    setPickerVisible(true);
                  }}
                  style={({ pressed }) => [styles.addTimeBtn, pressed && { opacity: 0.8 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Add reminder time"
                >
                  <Text style={styles.addTimeBtnText}>+ Add Time</Text>
                </Pressable>

                {pickerVisible && (
                  <>
                    <DateTimePicker
                      value={pickerDate}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onPickerChange}
                      style={styles.picker}
                    />
                    {Platform.OS === 'ios' && (
                      <View style={styles.pickerActions}>
                        <Pressable
                          onPress={() => setPickerVisible(false)}
                          style={({ pressed }) => [styles.pickerCancelBtn, pressed && { opacity: 0.7 }]}
                          accessibilityRole="button"
                        >
                          <Text style={styles.pickerCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={confirmIOSPicker}
                          style={({ pressed }) => [styles.pickerConfirmBtn, pressed && { opacity: 0.8 }]}
                          accessibilityRole="button"
                        >
                          <Text style={styles.pickerConfirmText}>Add</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
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

          {/* Account section */}
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => void Linking.openURL('https://recallth.app/privacy')}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy"
            >
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={() => void Linking.openURL('https://recallth.app/terms')}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              accessibilityRole="link"
              accessibilityLabel="Terms of Service"
            >
              <Text style={styles.rowLabel}>Terms of Service</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>

          {/* Danger zone */}
          <Text style={styles.sectionLabel}>Danger Zone</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Delete Account',
                  'This will permanently delete your account and all your data. This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete Account',
                      style: 'destructive',
                      onPress: async () => {
                        if (!token) return;
                        try {
                          await deleteAccount(token);
                          await logout();
                          router.replace('/(auth)/login' as Parameters<typeof router.replace>[0]);
                        } catch {
                          Alert.alert('Error', 'Could not delete account. Please try again.');
                        }
                      },
                    },
                  ],
                );
              }}
              style={({ pressed }) => [styles.deleteAccountBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Delete account"
            >
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </Pressable>
          </View>

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
  addTimeBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addTimeBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  picker: {
    marginTop: spacing.sm,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  pickerCancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pickerCancelText: { fontSize: 14, color: colors.text3 },
  pickerConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pickerConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
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
  chevron: { fontSize: 18, color: colors.text3 },
  deleteAccountBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 15,
    color: colors.danger,
    fontWeight: '600',
  },
});
