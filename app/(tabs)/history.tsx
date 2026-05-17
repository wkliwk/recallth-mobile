/**
 * History screen — chronological timeline of chats, cabinet changes, and
 * profile updates. Supports type-filter chips, date grouping, and infinite
 * scroll via FlatList + onEndReached pagination.
 *
 * Backend endpoint: GET /history/timeline?page=N&limit=20
 * Closes #22
 */

import { useRouter } from 'expo-router';
import Fuse from 'fuse.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateGroupHeader } from '../../components/history/DateGroupHeader';
import { EditDoseSheet } from '../../components/history/EditDoseSheet';
import { FilterChip, FilterValue } from '../../components/history/FilterChip';
import { HistoryRow } from '../../components/history/HistoryRow';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonRow } from '../../components/ui/SkeletonRow';
import { AnyHistoryEntry, DoseEntry, TimelineEntry, fetchTimeline } from '../../services/history';
import { DoseLogEntry, EditDoseLogInput, editDoseLog, getDoseLogsRange, unlogDose } from '../../services/schedule';
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

// ─── Date presets ─────────────────────────────────────────────────────────

type DatePreset = 'all' | 'today' | 'week' | 'month';

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

function presetStartDate(preset: DatePreset): Date | null {
  const now = new Date();
  if (preset === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (preset === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (preset === 'month') {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}

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
  const [editingEntry, setEditingEntry] = useState<DoseLogEntry | null>(null);
  const [editedLogIds, setEditedLogIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');

  // Debounce search input 200ms
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

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
    // Step 1: type filter
    let entries: AnyHistoryEntry[];
    if (activeFilter === 'dose') {
      entries = doseEntries;
    } else if (activeFilter === 'all') {
      entries = [...allEntries, ...doseEntries].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    } else {
      entries = allEntries.filter((e) => e.type === activeFilter);
    }

    // Step 2: date preset filter
    const cutoff = presetStartDate(datePreset);
    if (cutoff) {
      entries = entries.filter((e) => new Date(e.timestamp) >= cutoff);
    }

    // Step 3: fuzzy name search (over summary field)
    if (debouncedSearch.trim().length > 0) {
      const fuse = new Fuse(entries, {
        keys: ['summary', 'data.supplementName'],
        threshold: 0.4,
        minMatchCharLength: 2,
      });
      entries = fuse.search(debouncedSearch.trim()).map((r) => r.item);
    }

    return entries;
  }, [allEntries, doseEntries, activeFilter, datePreset, debouncedSearch]);

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

  const hasActiveFilters = searchQuery.length > 0 || datePreset !== 'all';

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setDatePreset('all');
  }, []);

  const handleEditDose = useCallback(
    (logId: string) => {
      const entry = doseEntries.find((e) => e.data._id === logId);
      if (entry) setEditingEntry(entry.data);
    },
    [doseEntries],
  );

  const handleSaveEdit = useCallback(
    async (logId: string, takenAt: string, notes: string) => {
      if (!token) return;
      const input: EditDoseLogInput = { takenAt, notes };
      const updated = await editDoseLog(token, logId, input);
      setDoseEntries((prev) =>
        prev.map((e) =>
          e.data._id === logId
            ? { ...e, timestamp: updated.takenAt, data: { ...e.data, takenAt: updated.takenAt, notes: updated.notes } }
            : e,
        ),
      );
      setEditedLogIds((prev) => new Set(prev).add(logId));
    },
    [token],
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
          onEditDose={handleEditDose}
          doseNotes={doseNotes}
          editedLogIds={editedLogIds}
        />
      );
    },
    [handleChatPress, handleDeleteDose, handleEditDose, doseNotes, editedLogIds],
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
      {/* Search + filter header */}
      <View style={styles.filterBar}>
        {/* Search input */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search supplements…"
            placeholderTextColor={c.text3}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search history by supplement name"
            accessibilityRole="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearSearch}
              onPress={() => { setSearchQuery(''); setDebouncedSearch(''); }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </Pressable>
          )}
        </View>

        {/* Date preset chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateChipScroll}
        >
          {DATE_PRESETS.map((p) => (
            <Pressable
              key={p.value}
              style={({ pressed }) => [
                styles.dateChip,
                datePreset === p.value && styles.dateChipActive,
                pressed && styles.dateChipPressed,
              ]}
              onPress={() => setDatePreset(p.value)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${p.label}`}
              accessibilityState={{ selected: datePreset === p.value }}
            >
              <Text style={[styles.dateChipText, datePreset === p.value && styles.dateChipTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Type filter chips */}
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
        /* Empty state — search/filter empty vs. no data */
        hasActiveFilters ? (
          <View style={styles.errorContainer}>
            <Text style={styles.noResultsText}>🔍</Text>
            <Text style={styles.noResultsTitle}>No logs found</Text>
            <Text style={styles.noResultsSubtitle}>Try a different search or date range.</Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && styles.retryPressed]}
              onPress={handleClearFilters}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <Text style={styles.retryText}>Clear filters</Text>
            </Pressable>
          </View>
        ) : (
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
        )
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

      <EditDoseSheet
        entry={editingEntry}
        visible={editingEntry !== null}
        onSave={handleSaveEdit}
        onClose={() => setEditingEntry(null)}
      />
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenPad,
    marginBottom: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: c.text,
    height: '100%',
  },
  clearSearch: {
    paddingLeft: spacing.sm,
  },
  clearSearchText: {
    fontSize: 12,
    color: c.text3,
    fontWeight: '600',
  },
  dateChipScroll: {
    paddingHorizontal: spacing.screenPad,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dateChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  dateChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  dateChipPressed: {
    opacity: 0.7,
  },
  dateChipText: {
    ...typography.caption,
    color: c.text2,
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  filterScroll: {
    paddingHorizontal: spacing.screenPad,
    gap: spacing.sm,
  },
  noResultsText: {
    fontSize: 40,
  },
  noResultsTitle: {
    ...typography.sectionTitle,
    color: c.text,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    ...typography.bodySmall,
    color: c.text2,
    textAlign: 'center',
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
