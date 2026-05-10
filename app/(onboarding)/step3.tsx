/**
 * Step 3: Primary goal — single-select chips.
 * On completion: persists data to backend, marks onboarding seen, routes to tabs.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { seedProfile, seedSupplements } from '../../services/onboarding';
import { Goal, useOnboardingStore } from '../../stores/onboarding';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

type GoalOption = {
  label: string;
  desc: string;
  value: Exclude<Goal, null>;
};

const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'energy',
    label: 'Energy',
    desc: 'Boost daily vitality and fight fatigue.',
  },
  {
    value: 'sleep',
    label: 'Sleep',
    desc: 'Improve sleep quality and recovery overnight.',
  },
  {
    value: 'recovery',
    label: 'Recovery',
    desc: 'Faster muscle repair and reduced inflammation.',
  },
  {
    value: 'longevity',
    label: 'Longevity',
    desc: 'Support long-term health and healthy aging.',
  },
  {
    value: 'other',
    label: 'Other',
    desc: "I'll tell Recallth in chat.",
  },
];

export default function Step3Screen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { goal, setGoal, heightCm, weightKg, sex, age, cabinetItems, markSeen } =
    useOnboardingStore((s) => ({
      goal: s.goal,
      setGoal: s.setGoal,
      heightCm: s.heightCm,
      weightKg: s.weightKg,
      sex: s.sex,
      age: s.age,
      cabinetItems: s.cabinetItems,
      markSeen: s.markSeen,
    }));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finish = async (selectedGoal: Goal | null) => {
    setSaving(true);
    setError(null);
    try {
      if (token) {
        // Build profile payload from non-empty fields
        const profilePayload = {
          ...(heightCm.trim() && !isNaN(Number(heightCm))
            ? { height_cm: Number(heightCm) }
            : {}),
          ...(weightKg.trim() && !isNaN(Number(weightKg))
            ? { weight_kg: Number(weightKg) }
            : {}),
          ...(age.trim() && !isNaN(Number(age)) ? { age: Number(age) } : {}),
          ...(sex ? { sex } : {}),
          ...(selectedGoal ? { primary_goal: selectedGoal } : {}),
        };

        await Promise.allSettled([
          seedProfile(profilePayload, token),
          seedSupplements(cabinetItems, token),
        ]);
      }

      await markSeen();
      router.replace('/(onboarding)/done');
    } catch {
      setError('Could not save — you can update your profile later.');
    } finally {
      setSaving(false);
    }
  };

  const onSelect = (value: Exclude<Goal, null>) => {
    setGoal(goal === value ? null : value);
  };

  const onSkip = async () => {
    await finish(null);
  };

  const onFinish = async () => {
    await finish(goal);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress + skip */}
        <View style={styles.topRow}>
          <StepIndicator current={3} total={3} />
          <Pressable
            onPress={onSkip}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Skip goal selection"
          >
            <Text style={[styles.skip, saving && styles.skipDisabled]}>
              Skip for now
            </Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>What&apos;s your primary goal?</Text>
          <Text style={styles.subtitle}>
            Recallth will prioritise advice around this. You can always change
            it later.
          </Text>
        </View>

        {/* Goal cards */}
        <View style={styles.goals}>
          {GOAL_OPTIONS.map((opt) => {
            const selected = goal === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.goalCard, selected && styles.goalCardSelected]}
                onPress={() => onSelect(opt.value)}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
                accessibilityState={{ selected }}
              >
                <View style={styles.goalRow}>
                  <View
                    style={[
                      styles.goalRadio,
                      selected && styles.goalRadioSelected,
                    ]}
                  >
                    {selected && <View style={styles.goalRadioInner} />}
                  </View>
                  <View style={styles.goalContent}>
                    <Text
                      style={[
                        styles.goalLabel,
                        selected && styles.goalLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.goalDesc}>{opt.desc}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Finish */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.cta,
              pressed && styles.ctaPressed,
              saving && styles.ctaDisabled,
            ]}
            onPress={onFinish}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Finish setup"
          >
            {saving ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.ctaText}>Finish setup</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <View style={indicatorStyles.row} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            indicatorStyles.dot,
            i + 1 === current && indicatorStyles.dotActive,
            i + 1 < current && indicatorStyles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.text4,
  },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  dotDone: { backgroundColor: colors.primaryMid },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  skip: { ...typography.body, color: colors.text2 },
  skipDisabled: { opacity: 0.4 },
  header: { marginBottom: spacing.xxl },
  title: { ...typography.pageTitle, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.text2 },
  goals: { gap: spacing.md, marginBottom: spacing.xxl },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  goalCardSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  goalRadio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRadioSelected: { borderColor: colors.primary },
  goalRadioInner: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  goalContent: { flex: 1 },
  goalLabel: { ...typography.bodyStrong, color: colors.text },
  goalLabelSelected: { color: colors.primary },
  goalDesc: { ...typography.bodySmall, color: colors.text2, marginTop: 2 },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerMid,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  errorText: { ...typography.bodySmall, color: colors.danger },
  actions: { marginTop: spacing.sm },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { opacity: 0.85 },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { ...typography.cta, color: colors.surface },
});
