import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPassword } from '../../services/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(trimmed);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <Text style={styles.title}>Forgot password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {sent ? (
            <View style={styles.successCard}>
              <Text style={styles.successTitle}>Check your inbox</Text>
              <Text style={styles.successBody}>
                If an account exists for{' '}
                <Text style={{ fontWeight: '700' }}>{email.trim()}</Text>
                , a reset link has been sent. It expires in 1 hour.
              </Text>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
              >
                <Text style={styles.doneBtnText}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder="you@example.com"
                placeholderTextColor={colors.text3}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                editable={!submitting}
                accessibilityLabel="Email address"
              />
              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                onPress={onSubmit}
                disabled={submitting}
                style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }, submitting && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel="Send reset link"
              >
                {submitting
                  ? <ActivityIndicator color={colors.surface} />
                  : <Text style={styles.ctaText}>Send reset link</Text>}
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.lg,
  },
  backBtn: { marginBottom: spacing.xl },
  backText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  title: { ...typography.pageTitle, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.text2, marginBottom: spacing.xl },
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
    marginBottom: spacing.sm,
  },
  inputError: { borderColor: colors.danger },
  errorText: { ...typography.bodySmall, color: colors.danger, marginBottom: spacing.sm },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  ctaText: { ...typography.cta, color: colors.surface },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  successTitle: { ...typography.bodyStrong, color: colors.text, fontSize: 17 },
  successBody: { ...typography.body, color: colors.text2 },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  doneBtnText: { ...typography.bodyStrong, color: colors.surface },
});
