/**
 * Step 1: Body stats — height, weight, sex, age.
 * All fields are optional; user can skip the entire step.
 */
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sex, useOnboardingStore } from '../../stores/onboarding';
import { colors, radius, spacing, typography } from '../../utils/theme';

const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

export default function Step1Screen() {
  const router = useRouter();
  const { heightCm, weightKg, sex, age, setBodyStats } = useOnboardingStore(
    (s) => ({
      heightCm: s.heightCm,
      weightKg: s.weightKg,
      sex: s.sex,
      age: s.age,
      setBodyStats: s.setBodyStats,
    }),
  );

  const onNext = () => {
    router.push('/(onboarding)/step2');
  };

  const onSkip = () => {
    // Clear any partial entry and advance
    setBodyStats({ heightCm: '', weightKg: '', sex: null, age: '' });
    router.push('/(onboarding)/step2');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress + skip */}
          <View style={styles.topRow}>
            <StepIndicator current={1} total={3} />
            <Pressable
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip body stats step"
            >
              <Text style={styles.skip}>Skip for now</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              We use this to tailor dosing advice. All optional.
            </Text>
          </View>

          {/* Height */}
          <View style={styles.field}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={heightCm}
              onChangeText={(v) => setBodyStats({ heightCm: v })}
              placeholder="e.g. 175"
              placeholderTextColor={colors.text3}
              keyboardType="numeric"
              returnKeyType="next"
              accessibilityLabel="Height in centimetres"
            />
          </View>

          {/* Weight */}
          <View style={styles.field}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weightKg}
              onChangeText={(v) => setBodyStats({ weightKg: v })}
              placeholder="e.g. 70"
              placeholderTextColor={colors.text3}
              keyboardType="numeric"
              returnKeyType="next"
              accessibilityLabel="Weight in kilograms"
            />
          </View>

          {/* Age */}
          <View style={styles.field}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={(v) => setBodyStats({ age: v })}
              placeholder="e.g. 32"
              placeholderTextColor={colors.text3}
              keyboardType="numeric"
              returnKeyType="done"
              accessibilityLabel="Age in years"
            />
          </View>

          {/* Sex */}
          <View style={styles.field}>
            <Text style={styles.label}>Biological sex</Text>
            <View style={styles.chips}>
              {SEX_OPTIONS.map((opt) => {
                const selected = sex === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() =>
                      setBodyStats({ sex: selected ? null : opt.value })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Next */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
              ]}
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel="Continue to step 2"
            >
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  flex: { flex: 1 },
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
  header: { marginBottom: spacing.xxxl },
  title: { ...typography.pageTitle, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.text2 },
  field: { marginBottom: spacing.xl, gap: spacing.sm },
  label: { ...typography.bodyStrong, color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 48,
  },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipText: { ...typography.body, color: colors.text2 },
  chipTextSelected: { ...typography.bodyStrong, color: colors.primary },
  actions: { marginTop: spacing.xl },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { ...typography.cta, color: colors.surface },
});
