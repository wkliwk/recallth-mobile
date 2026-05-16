import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AISuggestionBanner } from '../../components/summary/AISuggestionBanner';
import { fetchDailyBrief } from '../../services/insights';
import { DoseProgressCard } from '../../components/summary/DoseProgressCard';
import { ScheduleSection } from '../../components/summary/ScheduleSection';
import {
  MOCK_SUPPLEMENTS,
  TIME_BLOCK_LABELS,
  TIME_BLOCK_ORDER,
  type SupplementEntry,
  type TimeBlock,
} from '../../components/summary/mockData';
import { listCabinetItems, type CabinetItem } from '../../services/cabinet';
import { logIntakeToday } from '../../services/intake';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function timingToBlock(timing: string | undefined): TimeBlock {
  const t = (timing ?? '').toLowerCase();
  if (t.includes('morning') || t.includes('breakfast')) return 'morning';
  if (t.includes('night') || t.includes('bed')) return 'night';
  if (t.includes('evening') || t.includes('dinner') || t.includes('supper')) return 'evening';
  if (t.includes('noon') || t.includes('midday') || t.includes('lunch') || t.includes('afternoon')) return 'midday';
  return 'morning';
}

function cabinetToEntry(item: CabinetItem): SupplementEntry {
  return {
    id: item._id,
    name: item.name,
    dose: item.dosage ?? '—',
    timeBlock: timingToBlock(item.timing),
    taken: false,
  };
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const token = useAuthStore((s) => s.token);
  const [supplements, setSupplements] = useState<SupplementEntry[]>(MOCK_SUPPLEMENTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(
    'You most often skip B-complex at midday. Consider moving it to your morning block to improve adherence.',
  );

  const lastLogAt = useRef<number>(0);

  const loadSupplements = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setSupplements(MOCK_SUPPLEMENTS);
        setLoading(false);
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [supplementsRes, briefRes] = await Promise.allSettled([
        listCabinetItems(token),
        fetchDailyBrief(token),
      ]);

      if (supplementsRes.status === 'fulfilled') {
        const entries = supplementsRes.value.map(cabinetToEntry);
        setSupplements(entries.length > 0 ? entries : MOCK_SUPPLEMENTS);
      } else {
        setSupplements(MOCK_SUPPLEMENTS);
      }

      if (briefRes.status === 'fulfilled') {
        setAiSuggestion(briefRes.value);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [token],
  );

  useEffect(() => {
    void loadSupplements(false);
  }, [loadSupplements]);

  const taken = supplements.filter((s) => s.taken).length;
  const total = supplements.length;

  const toggleTaken = useCallback(
    (id: string) => {
      let becameTaken = false;
      setSupplements((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          becameTaken = !s.taken;
          return { ...s, taken: becameTaken };
        }),
      );

      if (!becameTaken || !token) return;

      const now = Date.now();
      if (now - lastLogAt.current < 500) return;
      lastLogAt.current = now;

      void logIntakeToday(token).catch(() => {
        setSupplements((prev) =>
          prev.map((s) => (s.id === id ? { ...s, taken: !becameTaken } : s)),
        );
      });
    },
    [token],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadSupplements(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Topbar: greeting + date */}
        <View style={styles.topbar}>
          <Text style={styles.dateLabel}>{formatDate()}</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
        </View>

        {/* Dose progress hero card */}
        <DoseProgressCard taken={taken} total={total} />

        {/* Time-block schedule card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleCardHeader}>
            <Text style={styles.scheduleCardTitle}>Schedule</Text>
          </View>

          {TIME_BLOCK_ORDER.map((block: TimeBlock) => (
            <ScheduleSection
              key={block}
              label={TIME_BLOCK_LABELS[block]}
              items={supplements.filter((s) => s.timeBlock === block)}
              onToggle={toggleTaken}
            />
          ))}
        </View>

        {/* AI suggestion banner */}
        {aiSuggestion !== null && <AISuggestionBanner suggestion={aiSuggestion} />}

        <Text style={styles.disclaimer}>
          Not medical advice. Always consult your doctor.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topbar: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dateLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.text2,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.pageTitle,
    color: colors.text,
  },

  scheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleCardHeader: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleCardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },

  disclaimer: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.text4,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
