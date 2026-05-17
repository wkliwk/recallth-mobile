import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { getDoseLogsRange, type DoseLogEntry } from '../../services/schedule';
import { listCabinetItems, type CabinetItem } from '../../services/cabinet';
import { getStreak } from '../../services/intake';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplementInsight {
  id: string;
  name: string;
  startDate: string;
  activeDays: number;
  takenDays: number;
  pct: number;
  /** 30 entries: 'taken' | 'missed' | 'inactive' */
  heatmap: Array<'taken' | 'missed' | 'inactive'>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDateRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function computeBestStreak(logsByDate: Set<string>, dates: string[]): number {
  let best = 0;
  let current = 0;
  for (const d of dates) {
    if (logsByDate.has(d)) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function buildInsights(
  items: CabinetItem[],
  logs: DoseLogEntry[],
  dates: string[],
): SupplementInsight[] {
  const logsBySupp = new Map<string, Set<string>>();
  for (const log of logs) {
    const date = log.takenAt.slice(0, 10);
    if (!logsBySupp.has(log.supplementId)) logsBySupp.set(log.supplementId, new Set());
    logsBySupp.get(log.supplementId)!.add(date);
  }

  const today = dates[dates.length - 1]!;

  return items
    .filter((item) => item.active && !item.isPaused)
    .map((item) => {
      const startDate = (item.startDate ?? item.createdAt).slice(0, 10);
      const takenDates = logsBySupp.get(item._id) ?? new Set<string>();

      let activeDays = 0;
      let takenDays = 0;
      const heatmap: Array<'taken' | 'missed' | 'inactive'> = dates.map((d) => {
        if (d < startDate) return 'inactive';
        if (d > today) return 'inactive';
        activeDays++;
        if (takenDates.has(d)) { takenDays++; return 'taken'; }
        return 'missed';
      });

      const pct = activeDays > 0 ? Math.round((takenDays / activeDays) * 100) : 0;
      return { id: item._id, name: item.name, startDate, activeDays, takenDays, pct, heatmap };
    })
    .sort((a, b) => b.pct - a.pct);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const CELL_SIZE = 8;
const CELL_GAP = 2;

function HeatmapRow({ insight, dates }: { insight: SupplementInsight; dates: string[] }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.name} numberOfLines={1}>{insight.name}</Text>
      <View style={rowStyles.cells}>
        {insight.heatmap.map((state, i) => (
          <View
            key={dates[i]}
            style={[
              rowStyles.cell,
              state === 'taken' && rowStyles.cellTaken,
              state === 'missed' && rowStyles.cellMissed,
              state === 'inactive' && rowStyles.cellInactive,
            ]}
          />
        ))}
      </View>
      <Text style={rowStyles.pct}>{insight.pct}%</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  name: {
    width: 90,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text2,
  },
  cells: {
    flex: 1,
    flexDirection: 'row',
    gap: CELL_GAP,
    flexWrap: 'nowrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  cellTaken: { backgroundColor: colors.primary },
  cellMissed: { backgroundColor: colors.text4 },
  cellInactive: { backgroundColor: 'transparent', borderWidth: 0 },
  pct: {
    width: 34,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textAlign: 'right',
  },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function InsightsScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<SupplementInsight[]>([]);
  const [overallPct, setOverallPct] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [hasEnoughData, setHasEnoughData] = useState(true);
  const [dates] = useState(() => buildDateRange(30));

  const load = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const thirtyDaysAgo = dates[0]!;
      const today = dates[dates.length - 1]!;

      const [items, logs, streakData] = await Promise.all([
        listCabinetItems(token),
        getDoseLogsRange(token, thirtyDaysAgo, today),
        getStreak(token),
      ]);

      // Check if we have at least 7 days of logged data
      const logDates = new Set(logs.map((l) => l.takenAt.slice(0, 10)));
      if (logDates.size < 7) {
        setHasEnoughData(false);
        setLoading(false);
        return;
      }

      setHasEnoughData(true);
      const suppInsights = buildInsights(items, logs, dates);
      setInsights(suppInsights);
      setTotalActive(suppInsights.length);

      // Overall adherence: total taken / total active-days across all supplements
      const totalTaken = suppInsights.reduce((sum, s) => sum + s.takenDays, 0);
      const totalActiveDays = suppInsights.reduce((sum, s) => sum + s.activeDays, 0);
      setOverallPct(totalActiveDays > 0 ? Math.round((totalTaken / totalActiveDays) * 100) : 0);

      // Best streak: longest run of consecutive days with any dose logged
      setBestStreak(Math.max(streakData.currentStreak, computeBestStreak(logDates, dates)));
    } catch {
      // Show empty state on error
      setHasEnoughData(false);
    } finally {
      setLoading(false);
    }
  }, [token, dates]);

  useEffect(() => { void load(); }, [load]);

  const topPerformers = insights.filter((s) => s.activeDays >= 7).slice(0, 3);
  const needsAttention = insights.filter((s) => s.pct < 70 && s.activeDays >= 7).sort((a, b) => a.pct - b.pct).slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtn}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Insights</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !hasEnoughData ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>Keep logging</Text>
          <Text style={styles.emptyBody}>
            Insights appear after 7 days of data. Log your doses daily and check back soon.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{overallPct}%</Text>
              <Text style={styles.statLabel}>30-day adherence</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{bestStreak}</Text>
              <Text style={styles.statLabel}>Best streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalActive}</Text>
              <Text style={styles.statLabel}>Active supplements</Text>
            </View>
          </View>

          {/* Heatmap legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendLabel}>Taken</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.text4 }]} />
              <Text style={styles.legendLabel}>Missed</Text>
            </View>
            <Text style={styles.legendDates}>
              {new Date(dates[0]!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' — '}
              {new Date(dates[29]!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {/* Per-supplement heatmap */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>30-Day Heatmap</Text>
            {insights.map((insight) => (
              <HeatmapRow key={insight.id} insight={insight} dates={dates} />
            ))}
          </View>

          {/* Top performers */}
          {topPerformers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              {topPerformers.map((s) => (
                <View key={s.id} style={styles.rankRow}>
                  <View style={styles.rankBar}>
                    <View style={[styles.rankFill, { width: `${s.pct}%`, backgroundColor: colors.primary }]} />
                  </View>
                  <Text style={styles.rankName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.rankPct}>{s.pct}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* Needs attention */}
          {needsAttention.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Needs Attention</Text>
              {needsAttention.map((s) => (
                <View key={s.id} style={styles.rankRow}>
                  <View style={styles.rankBar}>
                    <View style={[styles.rankFill, { width: `${s.pct}%`, backgroundColor: colors.warning }]} />
                  </View>
                  <Text style={styles.rankName} numberOfLines={1}>{s.name}</Text>
                  <Text style={[styles.rankPct, { color: colors.warning }]}>{s.pct}%</Text>
                </View>
              ))}
              <Text style={styles.attentionNote}>
                These supplements are below 70% adherence. Consider adjusting timing or setting a reminder.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  headerRight: { width: 50 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.text2, textAlign: 'center', lineHeight: 22 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, fontWeight: '500', color: colors.text3, textAlign: 'center' },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { fontSize: 12, color: colors.text3 },
  legendDates: { marginLeft: 'auto', fontSize: 11, color: colors.text3 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 28,
  },
  rankBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  rankFill: { height: '100%', borderRadius: radius.full },
  rankName: { width: 100, fontSize: 13, color: colors.text2, fontWeight: '500' },
  rankPct: { width: 34, fontSize: 12, fontWeight: '700', color: colors.primary, textAlign: 'right' },
  attentionNote: {
    fontSize: 12,
    color: colors.text3,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    lineHeight: 17,
  },
});
