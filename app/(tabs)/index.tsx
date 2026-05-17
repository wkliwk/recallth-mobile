import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AISuggestionBanner } from '../../components/summary/AISuggestionBanner';
import { DailyCheckInCard } from '../../components/summary/DailyCheckInCard';
import { InteractionWarningBanner } from '../../components/summary/InteractionWarningBanner';
import { NotificationNudgeModal } from '../../components/summary/NotificationNudgeModal';
import { RestockAlertBanner } from '../../components/summary/RestockAlertBanner';
import { StreakMilestoneModal } from '../../components/summary/StreakMilestoneModal';
import { TimingSuggestionCard } from '../../components/summary/TimingSuggestionCard';
import { MonthlySummaryCard } from '../../components/summary/MonthlySummaryCard';
import { AddSheet } from '../../components/cabinet/AddSheet';
import { ErrorState } from '../../components/ui/ErrorState';
import { requestPermissions, scheduleDailyReminders } from '../../services/notifications';
import { getTodayJournal, type JournalEntry } from '../../services/journal';
import { DoseProgressCard } from '../../components/summary/DoseProgressCard';
import { MissedDoseChips } from '../../components/summary/MissedDoseChips';
import { ScheduleSection } from '../../components/summary/ScheduleSection';
import {
  MOCK_SUPPLEMENTS,
  TIME_BLOCK_LABELS,
  TIME_BLOCK_ORDER,
  type SupplementEntry,
  type TimeBlock,
} from '../../components/summary/mockData';
import { getInteractions, getRestockAlerts, listCabinetItems, updateCabinetItem, type CabinetItem, type CreateCabinetItemInput } from '../../services/cabinet';
import { logIntakeToday, getStreak } from '../../services/intake';
import { getTodayDoseLogs, getDoseLogsRange, logDose, unlogDose } from '../../services/schedule';
import { fetchDailyBrief, getMonthlySummary, type MonthlySummary } from '../../services/insights';
import { useAuthStore } from '../../stores/auth';
import * as storage from '../../services/storage';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { analyseTimingPatterns, type TimingSuggestion } from '../../utils/timingOptimiser';

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
  const [supplements, setSupplements] = useState<SupplementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const router = useRouter();
  const lastLogAt = useRef<number>(0);
  const [todayJournal, setTodayJournal] = useState<JournalEntry | null>(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [restockNames, setRestockNames] = useState<string[]>([]);
  const userId = useAuthStore((s) => s.user?.userId ?? null);
  const [milestoneDays, setMilestoneDays] = useState<number | null>(null);
  const [showNotifNudge, setShowNotifNudge] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [missedDismissed, setMissedDismissed] = useState<string[]>([]);
  const [timingSuggestions, setTimingSuggestions] = useState<TimingSuggestion[]>([]);
  const [dismissedTimingSuggestions, setDismissedTimingSuggestions] = useState<string[]>([]);
  const [cabinetItems, setCabinetItems] = useState<CabinetItem[]>([]);
  const [pendingTimingEdit, setPendingTimingEdit] = useState<{ item: CabinetItem; suggestedTiming: string } | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [monthlySummaryDismissed, setMonthlySummaryDismissed] = useState(false);

  const MILESTONES = [7, 30, 100];

  const loadSupplements = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (!token) {
        setLoading(false);
        return;
      }
      setLoadError(false);

      if (isRefresh) setRefreshing(true);
      else if (!isSilent) setLoading(true);

      const today = new Date().toISOString().slice(0, 10);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [supplementsRes, briefRes, doseLogsRes, journalRes, interactionsRes, restockRes, streakRes, recentLogsRes] = await Promise.allSettled([
        listCabinetItems(token),
        fetchDailyBrief(token),
        getTodayDoseLogs(token),
        getTodayJournal(token),
        getInteractions(token),
        getRestockAlerts(token),
        getStreak(token),
        getDoseLogsRange(token, fourteenDaysAgo, today),
      ]);

      if (supplementsRes.status === 'fulfilled') {
        setCabinetItems(supplementsRes.value);
        const now = new Date();
        const entries = supplementsRes.value
          .filter((item) => !(item.isPaused && item.pausedUntil && new Date(item.pausedUntil) > now))
          .map(cabinetToEntry);

        // Restore taken state from today's dose logs.
        if (doseLogsRes.status === 'fulfilled' && doseLogsRes.value.length > 0) {
          const logsBySuppId = new Map<string, string>();
          for (const log of doseLogsRes.value) {
            logsBySuppId.set(log.supplementId, log._id);
          }
          setSupplements(entries.map((s) => {
            const logId = logsBySuppId.get(s.id);
            return logId ? { ...s, taken: true, doseLogId: logId } : s;
          }));
        } else {
          setSupplements(entries);
        }
      } else {
        setSupplements([]);
        setLoadError(true);
      }

      if (briefRes.status === 'fulfilled') {
        setAiSuggestion(briefRes.value);
      }

      if (journalRes.status === 'fulfilled') {
        setTodayJournal(journalRes.value);
      }

      if (interactionsRes.status === 'fulfilled') {
        setInteractionCount(interactionsRes.value.length);
      }

      if (restockRes.status === 'fulfilled') {
        setRestockNames(restockRes.value.map((a) => a.name));
      }

      if (streakRes.status === 'fulfilled') {
        setCurrentStreak(streakRes.value.currentStreak);
      }

      if (recentLogsRes.status === 'fulfilled' && supplementsRes.status === 'fulfilled') {
        const pausedIds = new Set(
          supplementsRes.value.filter((x) => x.isPaused).map((x) => x._id),
        );
        const filteredLogs = recentLogsRes.value.filter((l) => !pausedIds.has(l.supplementId));
        const suggestions = analyseTimingPatterns(filteredLogs);
        setTimingSuggestions(suggestions);

        // Load persisted dismiss state
        const dismissKey = 'recallth:timing-dismissed';
        const raw = await storage.getItem(dismissKey);
        if (raw) {
          try {
            const parsed: Array<{ id: string; dismissedAt: number }> = JSON.parse(raw);
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            const stillDismissed = parsed
              .filter((x) => Date.now() - x.dismissedAt < sevenDaysMs)
              .map((x) => x.id);
            setDismissedTimingSuggestions(stillDismissed);
            // Rewrite storage without expired entries
            await storage.setItem(dismissKey, JSON.stringify(parsed.filter((x) => Date.now() - x.dismissedAt < sevenDaysMs)));
          } catch {
            // ignore parse errors
          }
        }
      }

      // Monthly summary: only load on the 1st of the month
      const nowDate = new Date();
      if (nowDate.getDate() === 1 || __DEV__) {
        const prevMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
        const monthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
        const dismissKey = `recallth:monthly-summary-dismissed:${monthStr}`;
        const dismissed = await storage.getItem(dismissKey);
        if (!dismissed) {
          try {
            const summary = await getMonthlySummary(token, monthStr);
            setMonthlySummary(summary);
          } catch {
            // Non-critical — ignore failures
          }
        } else {
          setMonthlySummaryDismissed(true);
        }
      }

      setLoading(false);
      setRefreshing(false);
    },
    [token],
  );

  const initialLoadDone = useRef(false);

  useEffect(() => {
    void loadSupplements(false);
    initialLoadDone.current = true;
  }, [loadSupplements]);

  useFocusEffect(
    useCallback(() => {
      if (!initialLoadDone.current) return;
      void loadSupplements(false, true);
    }, [loadSupplements]),
  );

  const taken = supplements.filter((s) => s.taken).length;
  const total = supplements.length;

  const toggleTaken = useCallback(
    (id: string) => {
      // Find the supplement before mutating state.
      const target = supplements.find((s) => s.id === id);
      if (!target) return;

      const becameTaken = !target.taken;

      // Optimistic update.
      setSupplements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, taken: becameTaken, doseLogId: becameTaken ? s.doseLogId : undefined } : s)),
      );

      if (!token) return;

      if (becameTaken) {
        // Log the specific dose + call streak endpoint on first mark of the day.
        void logDose(token, id, target.name, target.timeBlock).then(async (log) => {
          setSupplements((prev) =>
            prev.map((s) => (s.id === id ? { ...s, doseLogId: log._id } : s)),
          );
          // Show notification nudge after first-ever dose log if permission not yet granted.
          const nudgeKey = `recallth:notif-nudge-shown:${userId ?? 'anon'}`;
          const alreadyShown = await storage.getItem(nudgeKey);
          if (!alreadyShown) {
            const { status } = await import('expo-notifications').then((m) =>
              m.getPermissionsAsync(),
            );
            if (status !== 'granted') {
              await storage.setItem(nudgeKey, 'true');
              setShowNotifNudge(true);
            }
          }
        }).catch(() => {
          setSupplements((prev) =>
            prev.map((s) => (s.id === id ? { ...s, taken: false, doseLogId: undefined } : s)),
          );
        });

        const now = Date.now();
        if (now - lastLogAt.current >= 500) {
          lastLogAt.current = now;
          void logIntakeToday(token).then(async (result) => {
            const streak = result.currentStreak;
            if (!userId || !MILESTONES.includes(streak)) return;
            const key = `recallth:streak-milestone:${userId}:${streak}`;
            const already = await storage.getItem(key);
            if (!already) {
              await storage.setItem(key, 'true');
              setMilestoneDays(streak);
            }
          }).catch(() => {/* streak failure is non-critical */});
        }
      } else if (target.doseLogId) {
        // Undo the dose log.
        void unlogDose(token, target.doseLogId).catch(() => {
          setSupplements((prev) =>
            prev.map((s) => (s.id === id ? { ...s, taken: true } : s)),
          );
        });
      }
    },
    [token, supplements],
  );

  const handleLogLate = useCallback(
    (id: string) => {
      const target = supplements.find((s) => s.id === id);
      if (!target || !token) return;

      setSupplements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, taken: true } : s)),
      );
      setMissedDismissed((prev) => [...prev, id]);

      void logDose(token, id, target.name, target.timeBlock, true).then((log) => {
        setSupplements((prev) =>
          prev.map((s) => (s.id === id ? { ...s, doseLogId: log._id } : s)),
        );
      }).catch(() => {
        setSupplements((prev) =>
          prev.map((s) => (s.id === id ? { ...s, taken: false } : s)),
        );
        setMissedDismissed((prev) => prev.filter((x) => x !== id));
      });
    },
    [token, supplements],
  );

  const handleTimingDismiss = useCallback(async (supplementId: string) => {
    setDismissedTimingSuggestions((prev) => [...prev, supplementId]);
    const dismissKey = 'recallth:timing-dismissed';
    const raw = await storage.getItem(dismissKey);
    let existing: Array<{ id: string; dismissedAt: number }> = [];
    if (raw) {
      try { existing = JSON.parse(raw); } catch { /* ignore */ }
    }
    const updated = [...existing.filter((x) => x.id !== supplementId), { id: supplementId, dismissedAt: Date.now() }];
    await storage.setItem(dismissKey, JSON.stringify(updated));
  }, []);

  const handleTimingUpdate = useCallback((suggestion: TimingSuggestion) => {
    const item = cabinetItems.find((c) => c._id === suggestion.supplementId);
    if (!item) return;
    setPendingTimingEdit({ item, suggestedTiming: suggestion.label });
  }, [cabinetItems]);

  const handleTimingEditSave = useCallback(async (input: CreateCabinetItemInput) => {
    if (!pendingTimingEdit || !token) return;
    await updateCabinetItem(pendingTimingEdit.item._id, input, token);
    // Dismiss the suggestion after update
    void handleTimingDismiss(pendingTimingEdit.item._id);
    setPendingTimingEdit(null);
    void loadSupplements(false, true);
  }, [pendingTimingEdit, token, handleTimingDismiss, loadSupplements]);

  const visibleTimingSuggestions = useMemo(() =>
    timingSuggestions.filter((s) => !dismissedTimingSuggestions.includes(s.supplementId)),
    [timingSuggestions, dismissedTimingSuggestions],
  );

  const handleMonthlySummaryDismiss = useCallback(async () => {
    if (!monthlySummary) return;
    setMonthlySummaryDismissed(true);
    const dismissKey = `recallth:monthly-summary-dismissed:${monthlySummary.month}`;
    await storage.setItem(dismissKey, 'true');
  }, [monthlySummary]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError && supplements.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ErrorState
          message="Could not load your supplements. Check your connection and try again."
          onRetry={() => void loadSupplements(false)}
        />
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
        {/* Topbar: greeting + date + profile */}
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <Text style={styles.dateLabel}>{formatDate()}</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/profile' as Parameters<typeof router.push>[0])}
            style={({ pressed }) => [styles.profileBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.profileBtnText}>⊙</Text>
          </Pressable>
        </View>

        {/* Dose progress hero card */}
        <DoseProgressCard taken={taken} total={total} />

        {/* Restock alerts */}
        {restockNames.length > 0 && (
          <RestockAlertBanner
            names={restockNames}
            onPress={() => router.push('/(tabs)/cabinet' as Parameters<typeof router.push>[0])}
          />
        )}

        {/* Interaction warnings */}
        {interactionCount > 0 && (
          <InteractionWarningBanner
            count={interactionCount}
            onPress={() => router.push('/(tabs)/cabinet' as Parameters<typeof router.push>[0])}
          />
        )}

        {/* Monthly AI summary card */}
        {monthlySummary && !monthlySummaryDismissed && (
          <MonthlySummaryCard
            summary={monthlySummary}
            onDismiss={handleMonthlySummaryDismiss}
          />
        )}

        {/* Streak badge */}
        {currentStreak > 0 ? (
          <View style={styles.streakBadge}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{currentStreak} day streak</Text>
          </View>
        ) : (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>Start your streak today</Text>
          </View>
        )}

        {/* Timing optimiser suggestions */}
        {visibleTimingSuggestions.map((s) => (
          <TimingSuggestionCard
            key={s.supplementId}
            suggestion={s}
            onUpdate={handleTimingUpdate}
            onDismiss={handleTimingDismiss}
          />
        ))}

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

        {/* Missed dose chips */}
        <MissedDoseChips
          supplements={supplements}
          dismissed={missedDismissed}
          onLogLate={handleLogLate}
          onDismiss={(id) => setMissedDismissed((prev) => [...prev, id])}
        />

        {/* Daily check-in */}
        {token !== null && (
          <DailyCheckInCard
            token={token}
            existing={todayJournal}
            onLogged={(entry) => setTodayJournal(entry)}
          />
        )}

        {/* AI suggestion banner */}
        {aiSuggestion !== null && <AISuggestionBanner suggestion={aiSuggestion} />}

        <Text style={styles.disclaimer}>
          Not medical advice. Always consult your doctor.
        </Text>
      </ScrollView>

      {milestoneDays !== null && (
        <StreakMilestoneModal
          days={milestoneDays}
          onDismiss={() => setMilestoneDays(null)}
        />
      )}

      <NotificationNudgeModal
        visible={showNotifNudge}
        onNotNow={() => setShowNotifNudge(false)}
        onSure={async () => {
          setShowNotifNudge(false);
          const status = await requestPermissions();
          if (status === 'granted') {
            // Schedule a default 9am reminder if no times configured yet.
            await scheduleDailyReminders(['09:00']);
          }
        }}
      />

      {pendingTimingEdit && (
        <AddSheet
          visible
          onClose={() => setPendingTimingEdit(null)}
          onSave={handleTimingEditSave}
          item={{
            ...pendingTimingEdit.item,
            timing: pendingTimingEdit.suggestedTiming,
          }}
          existingItems={cabinetItems}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  topbarLeft: { flex: 1 },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileBtnText: { fontSize: 18, color: colors.text2 },
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

  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    marginBottom: 12,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
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
