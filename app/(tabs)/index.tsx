import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [signingOut, setSigningOut] = useState(false);

  const onLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      // Root layout's AuthGate will redirect to /(auth)/login.
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Recallth</Text>
        <Text style={styles.subtitle}>
          Your AI supplement and medication advisor.
        </Text>
        {user ? (
          <Text style={styles.email}>Signed in as {user.email}</Text>
        ) : null}
        <Pressable
          style={({ pressed }) => [
            styles.logout,
            pressed && styles.logoutPressed,
            signingOut && styles.logoutDisabled,
          ]}
          onPress={onLogout}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={styles.logoutText}>
            {signingOut ? 'Signing out...' : 'Log out'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text2,
    textAlign: 'center',
  },
  email: {
    ...typography.bodySmall,
    color: colors.text3,
    marginTop: spacing.sm,
  },
  logout: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutPressed: { opacity: 0.85 },
  logoutDisabled: { opacity: 0.6 },
  logoutText: {
    ...typography.cta,
    color: colors.text,
  },
});
