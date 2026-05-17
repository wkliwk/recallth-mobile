import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AISuggestionBanner } from '../../components/summary/AISuggestionBanner';
import { DailyCheckInCard } from '../../components/summary/DailyCheckInCard';
import { InteractionWarningBanner } from '../../components/summary/InteractionWarningBanner';
import { NotificationNudgeModal } from '../../components/summary/NotificationNudgeModal';
import { RestockAlertBanner } from '../../components/summary/RestockAlertBanner';
import { TimingSuggestionCard } from '../../components/summary/TimingSuggestionCard';
import { MonthlySummaryCard } from '../../components/summary/MonthlySummaryCard';
import { EffectRatingSheet, type EffectRatings } from '../../components/summary/EffectRatingSheet';
import { BadgeCelebrationModal } from '../../components/summary/BadgeCelebrationModal';
import { AddSheet } from '../../components/cabinet/AddSheet';
import { EmptyState } from '../../components/EmptyState';
import { BlockEffectNudgeBanner } from '../../components/home/BlockEffectNudgeBanner';
import { RecoveryBanner } from '../../components/home/RecoveryBanner';
import { RecoverySheet } from '../../components/home/RecoverySheet';
import { StackInteractionBanner, type StackWarning } from '../../components/home/StackInteractionBanner';
import { EffectivenessCheckInSheet } from '../../components/home/EffectivenessCheckInSheet';
import { ErrorState } from '../../components/ui/ErrorState';
import { UndoToast } from '../../components/ui/UndoToast';
import {
  cancelNudgesForBlocks,
  requestPermissions,
  scheduleDailyReminders,
  scheduleSmartReminders,
  scheduleWeeklySummaryNotification,
  type SupplementSchedule,
  type StreakContext,
} from '../../services/notifications';
import { getTodayJournal, type JournalEntry } from '../../services/journal';
import { DoseLogSheet } from '../../components/summary/DoseLogSheet';
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
import { logIntakeToday, getStreak, applyStreakFreeze } from '../../services/intake';
import { getTodayDoseLogs, getDoseLogsRange, logDose, unlogDose } from '../../services/schedule';
import { fetchDailyBrief, getMonthlySummary, type MonthlySummary } from '../../services/insights';
import { saveEffect } from '../../services/trends';
import { isEffectPromptDue, saveEffectRating, deferEffectPrompt, type EffectRating } from '../../utils/effectsStorage';
import { useAuthStore } from '../../stores/auth';
import * as Haptics from 'expo-haptics';
import * as storage from '../../services/storage';
import { shareProgressCard } from '../../utils/shareProgressCard';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { analyseTimingPatterns, type TimingSuggestion } from '../../utils/timingOptimiser';
import { STREAK_MILESTONES, badgeById, streakBadgeId, type EarnedBadge } from '../../utils/badges';

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
  const [showNotifNudge, setShowNotifNudge] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [freezeTokens, setFreezeTokens] = useState(0);
  const [missedDismissed, setMissedDismissed] = useState<string[]>([]);
  const [timingSuggestions, setTimingSuggestions] = useState<TimingSuggestion[]>([]);
  const [dismissedTimingSuggestions, setDismissedTimingSuggestions] = useState<string[]>([]);
  const [cabinetItems, setCabinetItems] = useState<CabinetItem[]>([]);
  const [pendingTimingEdit, setPendingTimingEdit] = useState<{ item: CabinetItem; suggestedTiming: string } | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary | null>(null);
  const [monthlySummaryDismissed, setMonthlySummaryDismissed] = useState(false);
  const [effectPrompt, setEffectPrompt] = useState<{ doseLogId: string; supplementId: string; supplementName: string } | null>(null);
  const effectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingBadge, setPendingBadge] = useState<string | null>(null);
  const [pendingDoseLog, setPendingDoseLog] = useState<SupplementEntry | null>(null);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [showRecoverySheet, setShowRecoverySheet] = useState(false);
  const [batchUndo, setBatchUndo] = useState<{ ids: string[]; logIds: string[]; count: number } | null>(null);
  const [stackWarning, setStackWarning] = useState<StackWarning | null>(null);
  const [effectCheckin, setEffectCheckin] = useState<{ supplementId: string; supplementName: string } | null>(null);
  const [effectNudgeInfo, setEffectNudgeInfo] = useState<{
    supplementId: string;
    supplementName: string;
    doseLogId: string;
    blockLabel: string;
    nudgeKey: string;
  } | null>(null);
  const [weeklyAdherencePct, setWeeklyAdherencePct] = useState(0);
  const [sharing, setSharing] = useState(false);

  const MILESTONES = [...STREAK_MILESTONES];

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
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const dayBeforeYesterday = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const [supplementsRes, briefRes, doseLogsRes, journalRes, interactionsRes, restockRes, streakRes, recentLogsRes, yesterdayLogsRes] = await Promise.allSettled([
        listCabinetItems(token),
        fetchDailyBrief(token),
        getTodayDoseLogs(token),
        getTodayJournal(token),
        getInteractions(token),
        getRestockAlerts(token),
        getStreak(token),
        getDoseLogsRange(token, fourteenDaysAgo, today),
        getDoseLogsRange(token, yesterday, yesterday),
      ]);

      if (supplementsRes.status === 'fulfilled') {
        setCabinetItems(supplementsRes.value);
        // Award Stack Starter badge if not already earned
        if (supplementsRes.value.length > 0) {
          const badgeRaw = await storage.getItem('recallth:earned_badges');
          let earned: EarnedBadge[] = [];
          try { if (badgeRaw) earned = JSON.parse(badgeRaw); } catch { /* ignore */ }
          if (!earned.some((b) => b.id === 'stack_starter')) {
            const updated = [...earned, { id: 'stack_starter', earnedAt: new Date().toISOString() }];
            await storage.setItem('recallth:earned_badges', JSON.stringify(updated));
            setPendingBadge('stack_starter');
          }
        }
        const now = new Date();
        const entries = supplementsRes.value
          .filter((item) => !(item.isPaused && item.pausedUntil && new Date(item.pausedUntil) > now))
          .map(cabinetToEntry);

        // Restore taken state from today's dose logs.
        let loggedBlocks: string[] = [];
        if (doseLogsRes.status === 'fulfilled' && doseLogsRes.value.length > 0) {
          const logsBySuppId = new Map<string, string>();
          const loggedSuppIds = new Set<string>();
          for (const log of doseLogsRes.value) {
            logsBySuppId.set(log.supplementId, log._id);
            loggedSuppIds.add(log.supplementId);
          }
          const finalEntries = entries.map((s) => {
            const logId = logsBySuppId.get(s.id);
            return logId ? { ...s, taken: true, doseLogId: logId } : s;
          });
          setSupplements(finalEntries);
          // Determine fully-logged blocks for nudge cancellation
          const blocks = [...new Set(finalEntries.map((s) => s.timeBlock))];
          loggedBlocks = blocks.filter((b) =>
            finalEntries.filter((s) => s.timeBlock === b).every((s) => s.taken),
          );
        } else {
          setSupplements(entries);
        }

        // Cancel nudge notifications for fully-logged time blocks
        if (loggedBlocks.length > 0) {
          void cancelNudgesForBlocks(loggedBlocks);
        }

        // Schedule smart supplement-named notifications (non-critical)
        const nudgeRaw = await storage.getItem('recallth:missed-nudges-enabled');
        const nudgesEnabled = nudgeRaw !== 'false';
        const blockTimes: Record<string, string> = {
          morning: '08:00', midday: '12:00', evening: '18:00', night: '21:00',
        };
        const schedulesByBlock = new Map<string, string[]>();
        for (const entry of entries) {
          const arr = schedulesByBlock.get(entry.timeBlock) ?? [];
          arr.push(entry.name);
          schedulesByBlock.set(entry.timeBlock, arr);
        }
        const schedules: SupplementSchedule[] = [];
        for (const [block, supps] of schedulesByBlock.entries()) {
          schedules.push({ time: blockTimes[block] ?? '09:00', supplements: supps, blockKey: block });
        }
        const status = await requestPermissions().catch(() => 'denied' as const);
        if (status === 'granted' && schedules.length > 0) {
          const weeklySummaryRaw = await storage.getItem('recallth:weekly-summary-enabled');
          const weeklySummaryEnabled = weeklySummaryRaw !== 'false';
          const streakCtx: StreakContext | undefined = streakRes.status === 'fulfilled' ? {
            streak: streakRes.value.currentStreak,
            freezeActive: (streakRes.value.freezeTokens ?? 0) > 0,
            missedYesterday:
              yesterdayLogsRes.status === 'fulfilled' &&
              yesterdayLogsRes.value.length === 0 &&
              streakRes.value.lastLoggedDate === dayBeforeYesterday,
          } : undefined;
          void scheduleSmartReminders(schedules, nudgesEnabled, streakCtx)
            .then(() => scheduleWeeklySummaryNotification(token, weeklySummaryEnabled, entries.length > 0))
            .catch(() => {/* non-critical */});
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
        const allInteractions = interactionsRes.value;
        setInteractionCount(allInteractions.length);

        // Detect stack interactions between supplements scheduled today
        if (supplementsRes.status === 'fulfilled' && allInteractions.length > 0) {
          const scheduledIds = new Set(
            supplementsRes.value
              .filter((item) => !(item.isPaused))
              .map((item) => item._id),
          );
          const today = new Date().toISOString().slice(0, 10);
          // Find first interaction where both supplements are in today's schedule
          for (const ix of allInteractions) {
            if (scheduledIds.has(ix.item1) && scheduledIds.has(ix.item2)) {
              const dismissKey = `interaction_dismissed_${ix.item1}_${ix.item2}_${today}`;
              const dismissed = await storage.getItem(dismissKey).catch(() => null);
              if (!dismissed) {
                const suppA = supplementsRes.value.find((x) => x._id === ix.item1);
                const suppB = supplementsRes.value.find((x) => x._id === ix.item2);
                if (suppA && suppB) {
                  setStackWarning({
                    nameA: suppA.name,
                    nameB: suppB.name,
                    description: ix.description,
                    suppIdA: ix.item1,
                    suppIdB: ix.item2,
                  });
                }
              }
              break; // only show highest-priority (first) interaction
            }
          }
        }
      }

      if (restockRes.status === 'fulfilled') {
        setRestockNames(restockRes.value.map((a) => a.name));
      }

      if (streakRes.status === 'fulfilled') {
        setCurrentStreak(streakRes.value.currentStreak);
        setFreezeTokens(streakRes.value.freezeTokens ?? 0);
      }

      // Auto-apply freeze if yesterday was missed and user has a token
      const missedYesterday =
        !isRefresh &&
        yesterdayLogsRes.status === 'fulfilled' &&
        yesterdayLogsRes.value.length === 0 &&
        supplementsRes.status === 'fulfilled' &&
        supplementsRes.value.length > 0 &&
        streakRes.status === 'fulfilled' &&
        streakRes.value.lastLoggedDate === dayBeforeYesterday;

      if (missedYesterday && token && (streakRes.status === 'fulfilled') && (streakRes.value.freezeTokens ?? 0) > 0) {
        applyStreakFreeze(token).then((result) => {
          setCurrentStreak(result.streak);
          setFreezeTokens(result.tokensLeft);
        }).catch(() => {
          // Freeze failed — show normal recovery banner as fallback
          setShowRecoveryBanner(true);
        });
      } else if (missedYesterday) {
        setShowRecoveryBanner(true);
      }

      if (recentLogsRes.status === 'fulfilled' && supplementsRes.status === 'fulfilled') {
        const pausedIds = new Set(
          supplementsRes.value.filter((x) => x.isPaused).map((x) => x._id),
        );
        const filteredLogs = recentLogsRes.value.filter((l) => !pausedIds.has(l.supplementId));
        const suggestions = analyseTimingPatterns(filteredLogs);
        setTimingSuggestions(suggestions);

        // Weekly adherence: unique supplement-day pairs in last 7 days / (activeCount × 7)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        const weekLogs = recentLogsRes.value.filter((l) => l.takenAt >= sevenDaysAgo && !pausedIds.has(l.supplementId));
        const uniquePairs = new Set(weekLogs.map((l) => `${l.supplementId}|${l.takenAt.slice(0, 10)}`));
        const activeCount = supplementsRes.value.filter((x) => x.active && !x.isPaused).length;
        const expected = activeCount * 7;
        setWeeklyAdherencePct(expected > 0 ? Math.min(100, (uniquePairs.size / expected) * 100) : 0);

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

      // Effectiveness check-in: find first supplement due for a weekly rating
      if (supplementsRes.status === 'fulfilled' && !isRefresh) {
        for (const item of supplementsRes.value) {
          if (item.isPaused) continue;
          const addedAt = item.startDate ?? item.createdAt;
          const due = await isEffectPromptDue(item._id, addedAt).catch(() => false);
          if (due) {
            setEffectCheckin({ supplementId: item._id, supplementName: item.name });
            break;
          }
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

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareProgressCard({
        streak: currentStreak,
        weeklyAdherencePct,
        activeSuppCount: cabinetItems.filter((x) => x.active).length,
      });
    } catch {
      // non-critical — share sheet may be dismissed
    } finally {
      setSharing(false);
    }
  }, [sharing, currentStreak, weeklyAdherencePct, cabinetItems]);

  const toggleTaken = useCallback(
    (id: string) => {
      // Find the supplement before mutating state.
      const target = supplements.find((s) => s.id === id);
      if (!target) return;

      const becameTaken = !target.taken;

      // For untaken supplements, open the note sheet instead of logging directly
      if (becameTaken) {
        setPendingDoseLog(target);
        return;
      }

      // Optimistic update for undo (taken → not taken only from here).
      setSupplements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, taken: false, doseLogId: undefined } : s)),
      );

      if (!token) return;

      // Undo the dose log.
      if (target.doseLogId) {
        void unlogDose(token, target.doseLogId).catch(() => {
          setSupplements((prev) =>
            prev.map((s) => (s.id === id ? { ...s, taken: true } : s)),
          );
        });
      }
    },
    [token, supplements],
  );

  const performDoseLog = useCallback(
    async (supplement: SupplementEntry, note: string) => {
      if (!token) { setPendingDoseLog(null); return; }
      const { id, name, timeBlock } = supplement;

      // Optimistic update
      setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, taken: true } : s));
      setPendingDoseLog(null);

      try {
        const log = await logDose(token, id, name, timeBlock, false, note || undefined);
        setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, doseLogId: log._id } : s));

        // Save note locally
        if (note.trim()) {
          void storage.setItem(`recallth:dose-notes:${log._id}`, note.trim());
        }

        // Prompt for effect rating 500ms after logging
        if (effectTimerRef.current) clearTimeout(effectTimerRef.current);
        effectTimerRef.current = setTimeout(() => {
          setEffectPrompt({ doseLogId: log._id, supplementId: id, supplementName: name });
        }, 500);

        // Show notification nudge after first-ever dose log
        const nudgeKey = `recallth:notif-nudge-shown:${userId ?? 'anon'}`;
        const alreadyShown = await storage.getItem(nudgeKey);
        if (!alreadyShown) {
          const { status } = await import('expo-notifications').then((m) => m.getPermissionsAsync());
          if (status !== 'granted') {
            await storage.setItem(nudgeKey, 'true');
            setShowNotifNudge(true);
          }
        }

        // Streak + badge check
        const now = Date.now();
        if (now - lastLogAt.current >= 500) {
          lastLogAt.current = now;
          void logIntakeToday(token).then(async (result) => {
            const streak = result.currentStreak;
            setCurrentStreak(streak);
            if (result.freezeTokens !== undefined) setFreezeTokens(result.freezeTokens);
            if (!userId) return;
            const badgeRaw = await storage.getItem('recallth:earned_badges');
            let earned: EarnedBadge[] = [];
            try { if (badgeRaw) earned = JSON.parse(badgeRaw); } catch { /* ignore */ }
            const earnedIds = new Set(earned.map((b) => b.id));
            const newBadges: EarnedBadge[] = [];
            for (const m of MILESTONES) {
              const badgeId = streakBadgeId(m);
              if (streak >= m && !earnedIds.has(badgeId)) {
                newBadges.push({ id: badgeId, earnedAt: new Date().toISOString() });
              }
            }
            if (newBadges.length > 0) {
              const updated = [...earned, ...newBadges];
              await storage.setItem('recallth:earned_badges', JSON.stringify(updated));
              setPendingBadge(newBadges[newBadges.length - 1].id);
            }
          }).catch(() => {/* non-critical */});
        }
      } catch {
        setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, taken: false, doseLogId: undefined } : s));
      }
    },
    [token, userId, MILESTONES, effectTimerRef],
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

  const handleSwipeLog = useCallback(
    (id: string) => {
      const target = supplements.find((s) => s.id === id);
      if (!target || target.taken || !token) return;

      setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, taken: true } : s));

      void logDose(token, id, target.name, target.timeBlock).then((log) => {
        setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, doseLogId: log._id } : s));
        void logIntakeToday(token).catch(() => {/* non-critical */});
      }).catch(() => {
        setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, taken: false, doseLogId: undefined } : s));
      });
    },
    [token, supplements],
  );

  const handleSwipeUnlog = useCallback(
    (id: string) => {
      const target = supplements.find((s) => s.id === id);
      if (!target || !target.taken || !token) return;

      setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, taken: false, doseLogId: undefined } : s));

      if (target.doseLogId) {
        void unlogDose(token, target.doseLogId).catch(() => {
          setSupplements((prev) => prev.map((s) => s.id === id ? { ...s, taken: true } : s));
        });
      }
    },
    [token, supplements],
  );

  const handleLogAll = useCallback(
    (block: TimeBlock) => {
      if (!token) return;
      const targets = supplements.filter((s) => s.timeBlock === block && !s.taken);
      if (targets.length === 0) return;

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Optimistic update — mark all as taken
      setSupplements((prev) =>
        prev.map((s) => targets.some((t) => t.id === s.id) ? { ...s, taken: true } : s),
      );

      // Log each dose in parallel, update doseLogId as responses arrive
      Promise.allSettled(
        targets.map((t) =>
          logDose(token, t.id, t.name, t.timeBlock).then((log) => {
            setSupplements((prev) =>
              prev.map((s) => s.id === t.id ? { ...s, doseLogId: log._id } : s),
            );
            return { target: t, logId: log._id };
          }),
        ),
      ).then((results) => {
        const successful: Array<{ target: SupplementEntry; logId: string }> = [];
        // Restore any failed ones
        results.forEach((r, i) => {
          if (r.status === 'rejected') {
            setSupplements((prev) =>
              prev.map((s) => s.id === targets[i]?.id ? { ...s, taken: false, doseLogId: undefined } : s),
            );
          } else {
            successful.push(r.value);
          }
        });

        if (successful.length > 0) {
          // Show undo toast
          setBatchUndo({
            ids: successful.map((s) => s.target.id),
            logIds: successful.map((s) => s.logId),
            count: successful.length,
          });
          // All-done haptic
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Single streak check after bulk log
        void logIntakeToday(token).catch(() => {/* non-critical */});
        // Block effect nudge — only if ≥2 supplements logged, not yet shown today
        if (successful.length >= 2) {
          const today = new Date().toISOString().slice(0, 10);
          const nudgeKey = `recallth:effect-nudge-${today}-${block}`;
          void storage.getItem(nudgeKey).then((existing) => {
            if (!existing) {
              const first = successful[0];
              if (first) {
                setEffectNudgeInfo({
                  supplementId: first.target.id,
                  supplementName: first.target.name,
                  doseLogId: first.logId,
                  blockLabel: TIME_BLOCK_LABELS[block],
                  nudgeKey,
                });
              }
            }
          });
        }
      });
    },
    [token, supplements],
  );

  const handleBatchUndo = useCallback(() => {
    if (!batchUndo || !token) return;
    const { ids, logIds } = batchUndo;
    setBatchUndo(null);
    // Revert optimistic state
    setSupplements((prev) =>
      prev.map((s) => ids.includes(s.id) ? { ...s, taken: false, doseLogId: undefined } : s),
    );
    // Delete each dose log
    logIds.forEach((logId) => {
      void unlogDose(token, logId).catch(() => {/* non-critical — already reverted in UI */});
    });
  }, [batchUndo, token]);

  const handleStackWarningDismiss = useCallback(async () => {
    if (!stackWarning) return;
    const today = new Date().toISOString().slice(0, 10);
    const dismissKey = `interaction_dismissed_${stackWarning.suppIdA}_${stackWarning.suppIdB}_${today}`;
    await storage.setItem(dismissKey, 'true');
    setStackWarning(null);
  }, [stackWarning]);

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

  const handleEffectSubmit = useCallback((ratings: EffectRatings) => {
    if (!effectPrompt || !token) { setEffectPrompt(null); return; }
    const { doseLogId, supplementId, supplementName } = effectPrompt;
    setEffectPrompt(null);
    void saveEffect(token, {
      doseLogId,
      supplementId,
      supplementName,
      ...ratings,
    }).catch(() => {/* non-critical, ignore */});
  }, [effectPrompt, token]);

  const handleEffectSkip = useCallback(() => {
    setEffectPrompt(null);
  }, []);

  const handleRecoveryConfirm = useCallback(
    async (selectedIds: string[]) => {
      if (!token) return;
      setShowRecoverySheet(false);
      setShowRecoveryBanner(false);

      const yesterdayNoon = new Date(Date.now() - 24 * 60 * 60 * 1000);
      yesterdayNoon.setHours(12, 0, 0, 0);
      const takenAt = yesterdayNoon.toISOString();

      await Promise.allSettled(
        selectedIds.map((id) => {
          const supp = supplements.find((s) => s.id === id);
          if (!supp) return Promise.resolve();
          return logDose(token, id, supp.name, supp.timeBlock, false, undefined, takenAt, true);
        }),
      );

      try {
        const newStreak = await getStreak(token);
        setCurrentStreak(newStreak.currentStreak);
        if (newStreak.freezeTokens !== undefined) setFreezeTokens(newStreak.freezeTokens);
      } catch {
        // non-critical
      }
    },
    [token, supplements],
  );

  const handleEffectNudgeRate = useCallback(() => {
    if (!effectNudgeInfo) return;
    void storage.setItem(effectNudgeInfo.nudgeKey, 'shown');
    setEffectPrompt({
      doseLogId: effectNudgeInfo.doseLogId,
      supplementId: effectNudgeInfo.supplementId,
      supplementName: effectNudgeInfo.supplementName,
    });
    setEffectNudgeInfo(null);
  }, [effectNudgeInfo]);

  const handleEffectNudgeLater = useCallback(() => {
    if (!effectNudgeInfo) return;
    void storage.setItem(effectNudgeInfo.nudgeKey, 'shown');
    setEffectNudgeInfo(null);
  }, [effectNudgeInfo]);

  const handleCheckinSave = useCallback((value: EffectRating['value'], note?: string) => {
    if (!effectCheckin) return;
    setEffectCheckin(null);
    void saveEffectRating(effectCheckin.supplementId, value, note);
  }, [effectCheckin]);

  const handleCheckinDefer = useCallback(() => {
    if (!effectCheckin) return;
    const id = effectCheckin.supplementId;
    setEffectCheckin(null);
    void deferEffectPrompt(id);
  }, [effectCheckin]);

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

        {/* Stack-specific interaction warning */}
        {stackWarning && (
          <StackInteractionBanner
            warning={stackWarning}
            onPress={() => router.push('/(tabs)/cabinet' as Parameters<typeof router.push>[0])}
            onDismiss={() => { void handleStackWarningDismiss(); }}
          />
        )}

        {/* Generic cabinet interaction count (when no specific warning shown) */}
        {!stackWarning && interactionCount > 0 && (
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
            {freezeTokens > 0 && (
              <View style={styles.freezeBadge}>
                <Text style={styles.freezeIcon}>🛡</Text>
                <Text style={styles.freezeCount}>{freezeTokens}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>Start your streak today</Text>
            {freezeTokens > 0 && (
              <View style={styles.freezeBadge}>
                <Text style={styles.freezeIcon}>🛡</Text>
                <Text style={styles.freezeCount}>{freezeTokens}</Text>
              </View>
            )}
          </View>
        )}

        {/* Share progress button — visible after 3+ day streak */}
        {currentStreak >= 3 && (
          <Pressable
            onPress={() => { void handleShare(); }}
            disabled={sharing}
            style={({ pressed }) => [styles.shareBtn, (pressed || sharing) && styles.shareBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Share my progress"
          >
            <Text style={styles.shareBtnText}>
              {sharing ? 'Generating…' : '🔗 Share my progress'}
            </Text>
          </Pressable>
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

        {/* Streak recovery banner */}
        {showRecoveryBanner && (
          <RecoveryBanner
            onRecover={() => setShowRecoverySheet(true)}
            onDismiss={() => setShowRecoveryBanner(false)}
          />
        )}

        {/* Block effect nudge banner */}
        {effectNudgeInfo && (
          <BlockEffectNudgeBanner
            blockLabel={effectNudgeInfo.blockLabel}
            onRateNow={handleEffectNudgeRate}
            onLater={handleEffectNudgeLater}
          />
        )}

        {/* Empty state when cabinet is empty (after load) */}
        {cabinetItems.length === 0 && (
          <EmptyState
            icon="leaf-outline"
            title="Your cabinet is empty"
            subtitle="Add your first supplement to start tracking doses, spot conflicts, and get AI insights."
            ctaLabel="Add your first supplement"
            onCta={() => router.push('/(tabs)/cabinet?openAdd=1' as Parameters<typeof router.push>[0])}
          />
        )}

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
              onLogAll={() => handleLogAll(block)}
              onSwipeLog={handleSwipeLog}
              onSwipeUnlog={handleSwipeUnlog}
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

      <BadgeCelebrationModal
        badge={pendingBadge ? (badgeById(pendingBadge) ?? null) : null}
        onDismiss={() => setPendingBadge(null)}
      />

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

      <EffectRatingSheet
        visible={effectPrompt !== null}
        supplementName={effectPrompt?.supplementName ?? ''}
        onSubmit={handleEffectSubmit}
        onSkip={handleEffectSkip}
      />

      {pendingDoseLog && (
        <DoseLogSheet
          supplement={pendingDoseLog}
          onLog={(note) => { void performDoseLog(pendingDoseLog, note); }}
          onCancel={() => setPendingDoseLog(null)}
        />
      )}

      {showRecoverySheet && (
        <RecoverySheet
          items={supplements}
          yesterdayLabel={new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
          onConfirm={(selectedIds) => { void handleRecoveryConfirm(selectedIds); }}
          onCancel={() => setShowRecoverySheet(false)}
        />
      )}

      {batchUndo && (
        <UndoToast
          message={`Logged ${batchUndo.count} supplement${batchUndo.count === 1 ? '' : 's'}`}
          onUndo={handleBatchUndo}
          onExpire={() => setBatchUndo(null)}
        />
      )}

      <EffectivenessCheckInSheet
        visible={effectCheckin !== null}
        supplementName={effectCheckin?.supplementName ?? ''}
        onSave={handleCheckinSave}
        onDefer={handleCheckinDefer}
      />
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
  freezeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
  },
  freezeIcon: {
    fontSize: 11,
  },
  freezeCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  shareBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    marginBottom: 12,
  },
  shareBtnPressed: {
    opacity: 0.7,
  },
  shareBtnText: {
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
