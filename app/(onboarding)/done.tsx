/**
 * Done screen — shown after completing the 3-step onboarding.
 * "You're set up — ask Recallth anything" + CTA into Chat.
 */
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingStore } from '../../stores/onboarding';
import { colors, radius, spacing, typography } from '../../utils/theme';

export default function DoneScreen() {
  const router = useRouter();
  const goal = useOnboardingStore((s) => s.goal);
  const cabinetItems = useOnboardingStore((s) => s.cabinetItems);

  const hasData = goal !== null || cabinetItems.length > 0;

  const onChat = () => {
    router.replace('/(tabs)');
  };

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 36, color: colors.surface, fontWeight: '700' },
  title: {
    ...typography.pageTitle,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text2,
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
    color: colors.text3,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.bodySmall, color: colors.text2 },
  chipGoal: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.aiLight,
    borderWidth: 1,
    borderColor: colors.ai,
  },
  chipGoalText: { ...typography.bodySmall, color: colors.ai, fontWeight: '600' },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { ...typography.cta, color: colors.surface },
});
