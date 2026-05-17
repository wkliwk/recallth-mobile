import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ExpoNotifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuthStore } from '../stores/auth';
import { useOnboardingStore } from '../stores/onboarding';
import { useAppearanceStore } from '../stores/appearance';
import {
  configureNotificationHandler,
  handleSnoozeResponse,
  registerNotificationCategories,
} from '../services/notifications';
import { colors } from '../utils/theme';
import { useIsDark } from '../utils/useTheme';

configureNotificationHandler();
void registerNotificationCategories();

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();

  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);

  const onboardingHydrated = useOnboardingStore((s) => s.isHydrated);
  const hasSeen = useOnboardingStore((s) => s.hasSeen);
  const hydrateOnboarding = useOnboardingStore((s) => s.hydrate);

  const hydrateAppearance = useAppearanceStore((s) => s.hydrate);

  // Hydrate stores once on mount.
  useEffect(() => {
    void hydrate();
    void hydrateOnboarding();
    void hydrateAppearance();
  }, [hydrate, hydrateOnboarding, hydrateAppearance]);

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
  const isDark = useIsDark();
  const router = useRouter();
  const notifResponseRef = useRef<ExpoNotifications.EventSubscription | null>(null);

  const bothHydrated = isHydrated && onboardingHydrated;

  // Deep-link to Home when user taps a dose reminder notification.
  // Also handles snooze action — reschedules the notification 30 min later.
  useEffect(() => {
    notifResponseRef.current = ExpoNotifications.addNotificationResponseReceivedListener(
      (response) => {
        void handleSnoozeResponse(response);

        if (response.actionIdentifier === 'SNOOZE') return;

        const screen = response.notification.request.content.data?.screen;
        if (screen === 'home') {
          router.push('/(tabs)' as Parameters<typeof router.push>[0]);
        } else if (screen === 'trends') {
          router.push('/(tabs)/trends' as Parameters<typeof router.push>[0]);
        }
      },
    );
    return () => {
      notifResponseRef.current?.remove();
    };
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
    </GestureHandlerRootView>
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
