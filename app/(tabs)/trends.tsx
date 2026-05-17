/**
 * Trends tab — issue #44
 *
 * Three stacked cards backed by existing backend endpoints:
 *   - Adherence streak  (GET /intake/streak)
 *   - Weight trend      (GET /profile/weight-trend)
 *   - Wellness score    (GET /wellness/score)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import AdherenceCard from '../../components/trends/AdherenceCard';
import { AdherenceTrendChart } from '../../components/trends/AdherenceTrendChart';
import JournalInsightsCard from '../../components/trends/JournalInsightsCard';
import MoodEnergyCard from '../../components/trends/MoodEnergyCard';
import RedundancyCard from '../../components/trends/RedundancyCard';
import EffectsCard from '../../components/trends/EffectsCard';
import JournalHistoryCard from '../../components/trends/JournalHistoryCard';
import StreakCard from '../../components/trends/StreakCard';
import WeightCard from '../../components/trends/WeightCard';
import WellnessCard from '../../components/trends/WellnessCard';
import { getRedundancies, listCabinetItems, type Redundancy } from '../../services/cabinet';
import { fetchJournalInsights, type JournalInsightsResult } from '../../services/insights';
import { getJournalEntries, type JournalEntry } from '../../services/journal';
import { getDoseLogsRange, type DoseLogEntry } from '../../services/schedule';
import {
  fetchEffects,
  fetchStreak,
  fetchWeightTrend,
  fetchWellnessScore,
  type IntakeStreak,
  type SupplementEffectAvg,
  type WeightTrendEntry,
  type WellnessScore,
} from '../../services/trends';
import { useAuthStore } from '../../stores/auth';
import { ColorPalette, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface TrendsState {
  effects: SupplementEffectAvg[];
  streak: IntakeStreak | null;
  weight: WeightTrendEntry[];
  wellness: WellnessScore | null;
  redundancies: Redundancy[];
  weekLogs: DoseLogEntry[];
  weekScheduled: number;
  journalEntries: JournalEntry[];
  journalInsights: JournalInsightsResult | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const initialState: TrendsState = {
  effects: [],
  streak: null,
  weight: [],
  wellness: null,
  redundancies: [],
  weekLogs: [],
  weekScheduled: 0,
  journalEntries: [],
  journalInsights: null,
  loading: true,
  refreshing: false,
  error: null,
};

export default function TrendsScreen() {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const [state, setState] = useState<TrendsState>(initialState);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setState((s) => ({ ...s, loading: false, error: 'Sign in to see your trends.' }));
        return;
      }

      setState((s) => ({
        ...s,
        loading: !isRefresh,
        refreshing: isRefresh,
        error: null,
      }));

      // Resolve each card independently — one endpoint failing shouldn't blank the screen.
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [streakRes, weightRes, wellnessRes, redundanciesRes, weekLogsRes, cabinetRes, journalRes, journalInsightsRes, effectsRes] = await Promise.allSettled([
        fetchStreak(token),
        fetchWeightTrend(token),
        fetchWellnessScore(token),
        getRedundancies(token),
        getDoseLogsRange(token, weekAgo, today),
        listCabinetItems(token),
        getJournalEntries(token, 14),
        fetchJournalInsights(token),
        fetchEffects(token, 30),
      ]);

      const weekLogs = weekLogsRes.status === 'fulfilled' ? weekLogsRes.value : [];
      const streak = streakRes.status === 'fulfilled' ? streakRes.value : null;
      const cabinetCount = cabinetRes.status === 'fulfilled' ? cabinetRes.value.length : 0;

      setState({
        effects: effectsRes.status === 'fulfilled' ? effectsRes.value : [],
        streak,
        weight: weightRes.status === 'fulfilled' ? weightRes.value : [],
        wellness: wellnessRes.status === 'fulfilled' ? wellnessRes.value : null,
        redundancies: redundanciesRes.status === 'fulfilled' ? redundanciesRes.value : [],
        weekLogs,
        weekScheduled: cabinetCount,
        journalEntries: journalRes.status === 'fulfilled' ? journalRes.value : [],
        journalInsights: journalInsightsRes.status === 'fulfilled' ? journalInsightsRes.value : null,
        loading: false,
        refreshing: false,
        error:
          streakRes.status === 'rejected' &&
          weightRes.status === 'rejected' &&
          wellnessRes.status === 'rejected'
            ? 'Could not load trends. Pull to refresh.'
            : null,
      });
    },
    [token],
  );

  // Initial load.
  useEffect(() => {
    void load(false);
  }, [load]);

  // Refetch streak only when tab regains focus (e.g. after tapping Summary checkboxes).
  // Skip the very first focus event since useEffect above already loads.
  const mountedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!mountedRef.current) {
        mountedRef.current = true;
        return;
      }
      // Only refresh streak — avoid hammering all 3 endpoints on every tab switch.
      if (!token) return;
      void fetchStreak(token).then((streak) => {
        setState((s) => ({ ...s, streak }));
      });
    }, [token]),
  );

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
          <Text style={styles.loadingText}>Loading trends…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{state.error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
            onPress={() => void load(false)}
            accessibilityRole="button"
            accessibilityLabel="Retry loading trends"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={() => void load(true)}
            tintColor={c.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Trends</Text>
              <Text style={styles.subtitle}>Your consistency, body, and overall score.</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/insights' as Parameters<typeof router.push>[0])}
              style={({ pressed }) => [styles.insightsBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="View adherence insights"
            >
              <Text style={styles.insightsBtnText}>Insights →</Text>
            </Pressable>
          </View>
        </View>

        <AdherenceTrendChart logs={state.weekLogs} scheduledPerDay={state.weekScheduled} />
        <StreakCard streak={state.streak} />
        <AdherenceCard logs={state.weekLogs} totalScheduled={state.weekScheduled} />
        <EffectsCard effects={state.effects} />
        <MoodEnergyCard entries={state.journalEntries} />
        <JournalInsightsCard
          insights={state.journalInsights?.insights ?? []}
          isEmpty={state.journalInsights?.insufficientData ?? true}
          generatedAt={state.journalInsights?.generatedAt ?? null}
        />
        <WeightCard entries={state.weight} />
        <WellnessCard score={state.wellness} />
        <RedundancyCard redundancies={state.redundancies} />
        <JournalHistoryCard entries={state.journalEntries} />

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.screenPad,
      paddingTop: spacing.lg,
    },
    header: {
      marginBottom: spacing.lg,
      gap: 4,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    insightsBtn: {
      backgroundColor: c.primaryLight,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 4,
    },
    insightsBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.primary,
    },
    title: {
      ...typography.pageTitle,
      color: c.text,
    },
    subtitle: {
      ...typography.bodySmall,
      color: c.text2,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xxl,
      gap: spacing.md,
    },
    loadingText: {
      ...typography.body,
      color: c.text2,
      marginTop: spacing.sm,
    },
    errorText: {
      ...typography.body,
      color: c.danger,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: spacing.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: 14,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
    },
    retryText: {
      ...typography.bodyStrong,
      color: c.text,
    },
  });
}
