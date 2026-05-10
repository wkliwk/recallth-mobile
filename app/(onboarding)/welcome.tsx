import { useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingStore } from '../../stores/onboarding';
import { colors, radius, spacing, typography } from '../../utils/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const markSeen = useOnboardingStore((s) => s.markSeen);

  const onSkip = async () => {
    await markSeen();
    router.replace('/(tabs)');
  };

  const onStart = () => {
    router.push('/(onboarding)/step1');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Skip link */}
        <View style={styles.skipRow}>
          <Pressable
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skip}>Skip for now</Text>
          </Pressable>
        </View>

        {/* Logo / brand mark */}
        <View style={styles.logoWrap}>
          <View style={styles.logo} accessibilityLabel="Recallth logo">
            <Text style={styles.logoText}>R</Text>
          </View>
        </View>

        {/* Headline */}
        <View style={styles.hero}>
          <Text style={styles.title}>Welcome to Recallth</Text>
          <Text style={styles.subtitle}>
            Your AI-powered supplement and health companion. A quick 3-step
            setup helps Recallth give you better answers from day one.
          </Text>
        </View>

        {/* Feature bullets */}
        <View style={styles.bullets}>
          {BULLETS.map((b) => (
            <View key={b.label} style={styles.bullet}>
              <View style={styles.bulletDot} />
              <View style={styles.bulletContent}>
                <Text style={styles.bulletLabel}>{b.label}</Text>
                <Text style={styles.bulletDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel="Set up my profile"
          >
            <Text style={styles.ctaText}>Set up my profile</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip and go to app"
          >
            <Text style={styles.secondaryText}>Skip — ask me anything</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BULLETS = [
  {
    label: 'Body stats',
    desc: 'Height, weight, age, and sex for personalised dosing advice.',
  },
  {
    label: 'Your cabinet',
    desc: 'Add up to 3 supplements you already take.',
  },
  {
    label: 'Primary goal',
    desc: 'Energy, sleep, recovery, longevity — whatever matters most.',
  },
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  skipRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
  },
  skip: { ...typography.body, color: colors.text2 },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xxxl },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.surface,
  },
  hero: { marginBottom: spacing.xxxl, alignItems: 'center' },
  title: {
    ...typography.pageTitle,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  bullets: { gap: spacing.lg, marginBottom: spacing.xxxl },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  bulletContent: { flex: 1 },
  bulletLabel: { ...typography.bodyStrong, color: colors.text },
  bulletDesc: { ...typography.bodySmall, color: colors.text2, marginTop: 2 },
  actions: { gap: spacing.md },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { ...typography.cta, color: colors.surface },
  secondaryBtn: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryText: { ...typography.cta, color: colors.text2 },
});
