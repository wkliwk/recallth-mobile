import { Link, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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

import { useAuthStore } from '../../stores/auth';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { validateEmail, validatePassword } from '../../utils/validation';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setFormError(null);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : 'Sign in failed';
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue with Recallth
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
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={onSubmit}
                editable={!submitting}
                accessibilityLabel="Password"
              />
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
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
              accessibilityLabel="Sign in"
            >
              {submitting ? (
                <ActivityIndicator color={c.surface} />
              ) : (
                <Text style={styles.ctaText}>Sign in</Text>
              )}
            </Pressable>

            <Link href="/(auth)/forgot-password" asChild>
              <Pressable style={styles.forgotBtn} accessibilityRole="link" accessibilityLabel="Forgot password">
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </Link>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account? </Text>
              <Link href="/(auth)/signup" replace asChild>
                <Pressable accessibilityRole="link">
                  <Text style={styles.footerLink}>Create one</Text>
                </Pressable>
              </Link>
            </View>
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
    label: {
      ...typography.bodyStrong,
      color: c.text,
    },
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
    errorText: {
      ...typography.bodySmall,
      color: c.danger,
    },
    banner: {
      backgroundColor: c.dangerLight,
      borderColor: c.dangerMid,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    bannerText: {
      ...typography.bodySmall,
      color: c.danger,
    },
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
    ctaText: {
      ...typography.cta,
      color: c.surface,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    footerText: { ...typography.body, color: c.text2 },
    footerLink: {
      ...typography.bodyStrong,
      color: c.primary,
    },
    forgotBtn: { alignItems: 'center', paddingVertical: spacing.xs },
    forgotText: { ...typography.bodySmall, color: c.primary },
  });
}
