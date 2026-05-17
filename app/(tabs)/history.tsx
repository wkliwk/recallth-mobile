/**
 * History screen — chronological timeline of chats, cabinet changes, and
 * profile updates. Supports type-filter chips, date grouping, and infinite
 * scroll via FlatList + onEndReached pagination.
 *
 * Backend endpoint: GET /history/timeline?page=N&limit=20
 * Closes #22
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateGroupHeader } from '../../components/history/DateGroupHeader';
import { FilterChip, FilterValue } from '../../components/history/FilterChip';
import { HistoryRow } from '../../components/history/HistoryRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRow } from '../../components/ui/SkeletonRow';
import { AnyHistoryEntry, DoseEntry, TimelineEntry, fetchTimeline } from '../../services/history';
import { getDoseLogsRange, unlogDose } from '../../services/schedule';
import { getItem } from '../../services/storage';
import { useAuthStore } from '../../stores/auth';
import { groupByDate } from '../../utils/dateGrouping';
import { ColorPalette, colors, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

// ─── List item discriminated union ────────────────────────────────────────

type ListHeader = { kind: 'header'; label: string; id: string };
type ListEntry = { kind: 'entry'; entry: AnyHistoryEntry; id: string };
type ListItem = ListHeader | ListEntry;

// ─── Filter config ────────────────────────────────────────────────────────

interface FilterConfig {
  label: string;
  value: FilterValue;
}

const FILTERS: FilterConfig[] = [
  { label: 'All', value: 'all' },
  { label: 'Chats', value: 'conversation' },
  { label: 'Cabinet', value: 'cabinet_change' },
  { label: 'Profile', value: 'profile_change' },
  { label: 'Doses', value: 'dose' },
];

const EMPTY_MESSAGES: Record<FilterValue, { title: string; subtitle: string; illustration: string }> = {
  all: {
    illustration: '📭',
    title: 'No history yet',
    subtitle: 'Your chats, cabinet changes, and profile updates will appear here.',
  },
  conversation: {
    illustration: '💬',
    title: 'No chats yet',
    subtitle: 'Start a conversation with the AI to see your chat history here.',
  },
  cabinet_change: {
    illustration: '🗄️',
    title: 'No cabinet changes',
    subtitle: 'Add or edit supplements in your cabinet and the changes will appear here.',
  },
  profile_change: {
    illustration: '👤',
    title: 'No profile updates',
    subtitle: 'Profile updates from your conversations will appear here.',
  },
  dose: {
    illustration: '💊',
    title: 'No doses logged',
    subtitle: 'Tap the checkmarks on the Home screen to log your daily doses.',
  },
};

const PAGE_SIZE = 20;

// ─── Screen ───────────────────────────────────────────────────────────────

export default function HistoryScreen(): React.JSX.Element {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [allEntries, setAllEntries] = useState<TimelineEntry[]>([]);
  const [doseEntries, setDoseEntries] = useState<DoseEntry[]>([]);
  const [doseNotes, setDoseNotes] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track whether initial load has completed
  const initialLoadDone = useRef(false);

  // ── Load page ────────────────────────────────────────────────────────

  const loadPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!token) return;
      if (replace) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        const result = await fetchTimeline(token, pageNum, PAGE_SIZE);
        setAllEntries((prev) => (replace ? result.data : [...prev, ...result.data]));
        setPage(pageNum);
        setHasMore(result.hasMore);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load history';
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [token],
  );

  const loadDoseLogs = useCallback(async () => {
    if (!token) return;
    const to = new Date().toISOString().slice(0, 10);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = fromDate.toISOString().slice(0, 10);
    try {
      const logs = await getDoseLogsRange(token, from, to);
      setDoseEntries(
        logs.map((log) => ({
          type: 'dose' as const,
          timestamp: log.takenAt,
          summary: `${log.supplementName} — ${log.slot}`,
          data: log,
        })),
      );
      const noteEntries = await Promise.all(
        logs.map(async (log) => {
          const note = await getItem(`recallth:dose-notes:${log._id}`);
          return [log._id, note] as const;
        }),
      );
      const notesMap: Record<string, string> = {};
      for (const [id, note] of noteEntries) {
        if (note) notesMap[id] = note;
      }
      setDoseNotes(notesMap);
    } catch {
      // non-critical
    }
  }, [token]);

  // Initial load — once on mount via ref guard
  const startedRef = useRef(false);
  if (!startedRef.current) {
    startedRef.current = true;
    initialLoadDone.current = false;
    void Promise.all([loadPage(1, true), loadDoseLogs()]).then(() => {
      initialLoadDone.current = true;
    });
  }

  // ── Retry ────────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    void Promise.all([loadPage(1, true), loadDoseLogs()]);
  }, [loadPage, loadDoseLogs]);

  // ── Load more ────────────────────────────────────────────────────────

  const handleEndReached = useCallback(() => {
    if (isLoadingMore || isLoading || !hasMore) return;
    void loadPage(page + 1, false);
  }, [isLoadingMore, isLoading, hasMore, loadPage, page]);

  // ── Filter entries ───────────────────────────────────────────────────

  const filteredEntries = useMemo<AnyHistoryEntry[]>(() => {
    if (activeFilter === 'dose') return doseEntries;
    const base = activeFilter === 'all'
      ? allEntries
      : allEntries.filter((e) => e.type === activeFilter);
    if (activeFilter === 'all') {
      return [...base, ...doseEntries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    }
    return base;
  }, [allEntries, doseEntries, activeFilter]);

  // ── Build flat list ──────────────────────────────────────────────────
  // We interleave DateGroupHeader items as synthetic list entries so FlatList
  // can render them efficiently without nesting ScrollViews.

  const listItems = useMemo<ListItem[]>(() => {
    const groups = groupByDate(filteredEntries);
    const result: ListItem[] = [];
    for (const group of groups) {
      result.push({ kind: 'header', label: group.label, id: `header-${group.label}` });
      for (const entry of group.items) {
        const entryId =
          entry.type === 'conversation'
            ? entry.data._id
            : entry.type === 'dose'
            ? `dose-${entry.data._id}`
            : `${entry.type}-${entry.timestamp}`;
        result.push({ kind: 'entry', entry, id: entryId });
      }
    }
    return result;
  }, [filteredEntries]);

  // ── Navigate to chat thread ──────────────────────────────────────────

  const handleChatPress = useCallback(
    (conversationId: string) => {
      // Route to the chat tab with the conversation ID as a param.
      // The chat screen (future issue) will read conversationId from params.
      router.push({
        pathname: '/(tabs)/chat',
        params: { conversationId },
      } as Parameters<typeof router.push>[0]);
    },
    [router],
  );

  const handleDeleteDose = useCallback(
    async (logId: string) => {
      if (!token) return;
      // Optimistically remove the entry
      const removed = doseEntries.find((e) => e.data._id === logId);
      setDoseEntries((prev) => prev.filter((e) => e.data._id !== logId));
      try {
        await unlogDose(token, logId);
      } catch {
        // Restore on failure
        if (removed) setDoseEntries((prev) => [removed, ...prev]);
        Alert.alert('Delete failed', 'Could not remove the dose log. Please try again.');
      }
    },
    [token, doseEntries],
  );

  // ── Render item ──────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ListItem>) => {
      if (item.kind === 'header') {
        return <DateGroupHeader label={item.label} />;
      }
      return (
        <HistoryRow
          item={item.entry}
          onPressChatItem={handleChatPress}
          onDeleteDose={handleDeleteDose}
          doseNotes={doseNotes}
        />
      );
    },
    [handleChatPress, handleDeleteDose, doseNotes],
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  // ── Footer (load more spinner or end of list) ────────────────────────

  const ListFooter = useMemo(() => {
    if (isLoadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={c.primary} size="small" />
        </View>
      );
    }
    if (!hasMore && allEntries.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.footerText}>All caught up</Text>
        </View>
      );
    }
    return null;
  }, [isLoadingMore, hasMore, allEntries.length]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Filter chips row */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              value={f.value}
              active={activeFilter === f.value}
              onPress={setActiveFilter}
            />
          ))}
        </ScrollView>
      </View>

      {/* Loading skeleton */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : error ? (
        /* Error state */
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && styles.retryPressed]}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry loading history"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : filteredEntries.length === 0 ? (
        /* Empty state */
        <EmptyState
          illustration={EMPTY_MESSAGES[activeFilter].illustration}
          title={EMPTY_MESSAGES[activeFilter].title}
          subtitle={EMPTY_MESSAGES[activeFilter].subtitle}
          ctaLabel={activeFilter === 'all' || activeFilter === 'conversation' ? 'Start chatting' : undefined}
          onCta={
            activeFilter === 'all' || activeFilter === 'conversation'
              ? () => router.push('/(tabs)/chat' as Parameters<typeof router.push>[0])
              : undefined
          }
        />
      ) : (
        /* Timeline list */
        <FlatList<ListItem>
          data={listItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={ListFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: c.bg,
  },
  filterBar: {
    backgroundColor: c.bg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  filterScroll: {
    paddingHorizontal: spacing.screenPad,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  skeletonContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPad,
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: c.danger,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryPressed: {
    opacity: 0.8,
  },
  retryText: {
    ...typography.cta,
    color: c.text,
  },
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    ...typography.bodySmall,
    color: c.text3,
  },
});
}
