/**
 * Done screen — shown after completing the 3-step onboarding.
 * Persists profile stats + cabinet items to the backend, then
 * shows the "You're set up" success state with a CTA into Chat.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { seedProfile, seedSupplements } from '../../services/onboarding';
import {
  requestPermissions,
  scheduleSmartReminders,
  scheduleWeeklySummaryNotification,
  type SupplementSchedule,
} from '../../services/notifications';
import { useAuthStore } from '../../stores/auth';
import { useOnboardingStore } from '../../stores/onboarding';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

export default function DoneScreen() {
  const router = useRouter();
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const token = useAuthStore((s) => s.token);
  const goal = useOnboardingStore((s) => s.goal);
  const cabinetItems = useOnboardingStore((s) => s.cabinetItems);
  const heightCm = useOnboardingStore((s) => s.heightCm);
  const weightKg = useOnboardingStore((s) => s.weightKg);
  const sex = useOnboardingStore((s) => s.sex);
  const age = useOnboardingStore((s) => s.age);
  const markSeen = useOnboardingStore((s) => s.markSeen);

  const [saving, setSaving] = useState(true);
  const savedRef = useRef(false);

  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    async function persist() {
      try {
        if (token) {
          await Promise.allSettled([
            seedProfile(
              {
                height_cm: heightCm ? parseFloat(heightCm) : undefined,
                weight_kg: weightKg ? parseFloat(weightKg) : undefined,
                sex: sex ?? undefined,
                age: age ? parseInt(age, 10) : undefined,
                primary_goal: goal ?? undefined,
              },
              token,
            ),
            seedSupplements(cabinetItems, token),
          ]);
        }
        // Request notification permission at peak intent — after onboarding succeeds.
        // Fire-and-forget: we route to tabs regardless of the response.
        const permStatus = await requestPermissions().catch(() => 'denied' as const);
        if (permStatus === 'granted') {
          const schedules: SupplementSchedule[] = cabinetItems.length > 0
            ? [{ time: '08:00', supplements: cabinetItems, blockKey: 'morning' }]
            : [];
          if (schedules.length > 0) {
            await scheduleSmartReminders(schedules, true).catch(() => {/* non-critical */});
            if (token) {
              void scheduleWeeklySummaryNotification(token, true, cabinetItems.length > 0).catch(() => {});
            }
          }
        }
      } finally {
        await markSeen();
        setSaving(false);
      }
    }

    void persist();
  }, [token, heightCm, weightKg, sex, age, goal, cabinetItems, markSeen]);

  const hasData = goal !== null || cabinetItems.length > 0;

  const onChat = () => {
    router.replace('/(tabs)/chat');
  };

  if (saving) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
          <Text style={styles.savingText}>Setting up your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Success mark */}
        <View style={styles.checkWrap} accessibilityLabel="Setup complete">
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        </View>

        {/* Headline */}
        <Text style={styles.title}>You&apos;re set up!</Text>
        <Text style={styles.subtitle}>
          {hasData
            ? "Recallth has your profile ready. Ask anything about your supplements, dosing, interactions, or goals."
            : "Recallth is ready to help. Mention your supplements and goals in chat and it will remember them for you."}
        </Text>

        {/* Summary chips */}
        {cabinetItems.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>In your cabinet</Text>
            <View style={styles.chips}>
              {cabinetItems.map((item) => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {goal && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Primary goal</Text>
            <View style={styles.chips}>
              <View style={styles.chipGoal}>
                <Text style={styles.chipGoalText}>
                  {goal.charAt(0).toUpperCase() + goal.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={onChat}
          accessibilityRole="button"
          accessibilityLabel="Ask Recallth anything"
        >
          <Text style={styles.ctaText}>Ask Recallth anything</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    savingText: {
      ...typography.body,
      color: c.text2,
    },
    container: {
      flex: 1,
      paddingHorizontal: spacing.screenPad,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxxl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkWrap: { marginBottom: spacing.xxxl },
    check: {
      width: 80,
      height: 80,
      borderRadius: radius.full,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMark: { fontSize: 36, color: c.surface, fontWeight: '700' },
    title: {
      ...typography.pageTitle,
      color: c.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    subtitle: {
      ...typography.body,
      color: c.text2,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xxxl,
      maxWidth: 320,
    },
    summarySection: {
      width: '100%',
      marginBottom: spacing.xl,
    },
    summaryLabel: {
      ...typography.caption,
      color: c.text3,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipText: { ...typography.bodySmall, color: c.text2 },
    chipGoal: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: c.aiLight,
      borderWidth: 1,
      borderColor: c.ai,
    },
    chipGoalText: { ...typography.bodySmall, color: c.ai, fontWeight: '600' },
    cta: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      height: 54,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xl,
    },
    ctaPressed: { opacity: 0.85 },
    ctaText: { ...typography.cta, color: c.surface },
  });
}
