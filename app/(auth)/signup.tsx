import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../stores/auth';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../../utils/validation';

export default function SignupScreen() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setFormError(null);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validatePasswordConfirm(password, confirm);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (eErr || pErr || cErr) return;

    setSubmitting(true);
    try {
      await signup(email, password);
      // New users always go through onboarding; AuthGate will also handle
      // this reactively, but explicit routing avoids the round-trip delay.
      router.replace('/(onboarding)/welcome');
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Account creation failed';
      setFormError(message);
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Recallth keeps your supplement and health context across every chat.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError(null);
                  if (formError) setFormError(null);
                }}
                placeholder="you@example.com"
                placeholderTextColor={c.text3}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel="Email"
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, passwordError ? styles.inputError : null]}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (passwordError) setPasswordError(null);
                  if (formError) setFormError(null);
                }}
                placeholder="At least 8 characters"
                placeholderTextColor={c.text3}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel="Password"
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={[styles.input, confirmError ? styles.inputError : null]}
                value={confirm}
                onChangeText={(v) => {
                  setConfirm(v);
                  if (confirmError) setConfirmError(null);
                  if (formError) setFormError(null);
                }}
                placeholder="Re-enter your password"
                placeholderTextColor={c.text3}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                editable={!submitting}
                accessibilityLabel="Confirm password"
              />
              {confirmError ? (
                <Text style={styles.errorText}>{confirmError}</Text>
              ) : null}
            </View>

            {formError ? (
              <View style={styles.banner} accessibilityLiveRegion="polite">
                <Text style={styles.bannerText}>{formError}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
                submitting && styles.ctaDisabled,
              ]}
              onPress={onSubmit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              {submitting ? (
                <ActivityIndicator color={c.surface} />
              ) : (
                <Text style={styles.ctaText}>Create account</Text>
              )}
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/login" replace asChild>
                <Pressable accessibilityRole="link">
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>

            <Text style={styles.legalText}>
              By creating an account, you agree to our{' '}
              <Text
                style={styles.legalLink}
                onPress={() => void Linking.openURL('https://recallth.app/terms')}
                accessibilityRole="link"
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={styles.legalLink}
                onPress={() => void Linking.openURL('https://recallth.app/privacy')}
                accessibilityRole="link"
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    flex: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPad,
      paddingTop: spacing.xxxl,
      paddingBottom: spacing.xxl,
    },
    header: { marginBottom: spacing.xxxl },
    title: {
      ...typography.pageTitle,
      color: c.text,
      marginBottom: spacing.sm,
    },
    subtitle: { ...typography.body, color: c.text2 },
    form: { gap: spacing.lg },
    field: { gap: spacing.sm },
    label: { ...typography.bodyStrong, color: c.text },
    input: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 15,
      color: c.text,
      minHeight: 48,
    },
    inputError: { borderColor: c.danger },
    errorText: { ...typography.bodySmall, color: c.danger },
    banner: {
      backgroundColor: c.dangerLight,
      borderColor: c.dangerMid,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    bannerText: { ...typography.bodySmall, color: c.danger },
    cta: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    },
    ctaPressed: { opacity: 0.85 },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { ...typography.cta, color: c.surface },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    footerText: { ...typography.body, color: c.text2 },
    footerLink: { ...typography.bodyStrong, color: c.primary },
    legalText: {
      ...typography.caption,
      color: c.text3,
      textAlign: 'center',
      marginTop: spacing.md,
      lineHeight: 18,
    },
    legalLink: { color: c.primary, fontWeight: '600' },
  });
}
