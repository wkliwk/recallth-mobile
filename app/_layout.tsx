import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../stores/auth';
import { useOnboardingStore } from '../stores/onboarding';
import { colors } from '../utils/theme';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();

  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);

  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const hasSeen = useOnboardingStore((s) => s.hasSeen);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);

  // Hydrate both stores once on mount.
  useEffect(() => {
    void hydrate();
    void hydrateOnboarding();
  }, [hydrate, hydrateOnboarding]);

  // Redirect when auth + onboarding state resolves.
  useEffect(() => {
    if (!isHydrated || !onboardingHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inTabs = segments[0] === '(tabs)';

    if (!token) {
      // Unauthenticated — always go to login unless already in auth group.
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Authenticated path:
    if (inAuthGroup) {
      // Just signed up or logged in — decide where to send them.
      if (!hasSeen) {
        router.replace('/(onboarding)/welcome');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    if (inOnboarding) {
      // Already heading through onboarding — don't interrupt.
      return;
    }

    if (!inTabs && !inOnboarding) {
      // Catch-all: authenticated user landed somewhere unexpected.
      router.replace('/(tabs)');
    }
  }, [isHydrated, onboardingHydrated, token, hasSeen, segments, router]);

  return null;
}

export default function RootLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);

  const bothHydrated = isHydrated && onboardingHydrated;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthGate />
      {bothHydrated ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      ) : (
        <View style={styles.splash}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
