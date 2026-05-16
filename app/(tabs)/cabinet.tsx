import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CabinetCard } from '../../components/cabinet/CabinetCard';
import type { CabinetMockItem } from '../../components/cabinet/CabinetCard';
import {
  deleteCabinetItem,
  deriveStatus,
  getInteractions,
  listAllCabinetItems,
  type CabinetItem,
  type Interaction,
} from '../../services/cabinet';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Mock fallback (unauthenticated / demo) ───────────────────────────────────

const MOCK_DATA: CabinetMockItem[] = [
  { name: 'Vitamin D3', dose: '2000 IU', schedule: 'Daily · Morning', evidence: 'High', pct: 92, status: 'ok', stock: 24 },
  { name: 'Omega-3 EPA/DHA', dose: '1000 mg', schedule: 'Daily · Morning', evidence: 'High', pct: 95, status: 'ok', stock: 30 },
  { name: 'Creatine monohydrate', dose: '5 g', schedule: 'Daily', evidence: 'High', pct: 96, status: 'ok', stock: 45 },
  { name: 'Magnesium glycinate', dose: '200 mg', schedule: 'Noon + Night', evidence: 'Moderate', pct: 68, status: 'ok', stock: 18 },
  { name: 'Ashwagandha KSM-66', dose: '600 mg', schedule: 'Night', evidence: 'Moderate', pct: 58, status: 'conflict', conflictNote: 'Mild serotonergic — flag if taking SSRI' },
  { name: 'L-theanine', dose: '200 mg', schedule: 'With caffeine', evidence: 'Moderate', pct: 62, status: 'ok', stock: 40 },
  { name: 'B-complex', dose: '1 cap', schedule: 'Noon', evidence: 'Limited', pct: 35, status: 'ok', stock: 60 },
  { name: 'Zinc picolinate', dose: '15 mg', schedule: 'Noon', evidence: 'Moderate', pct: 55, status: 'conflict', conflictNote: 'May reduce Mg absorption — space 2hrs' },
];

// ─── API → card adapter ───────────────────────────────────────────────────────

function apiItemToCard(item: CabinetItem, interactions: Interaction[]): CabinetMockItem & { _id: string } {
  const hasConflict = interactions.some(
    (ix) => ix.item1 === item._id || ix.item2 === item._id,
  );
  const conflictNote = hasConflict
    ? interactions.find((ix) => ix.item1 === item._id || ix.item2 === item._id)?.description
    : undefined;

  const scheduleArr: string[] = [];
  if (item.frequency) scheduleArr.push(item.frequency);
  if (item.timing) scheduleArr.push(item.timing);
  const schedule = scheduleArr.join(' · ') || 'As needed';

  return {
    _id: item._id,
    name: item.name,
    dose: item.dosage ?? '—',
    schedule,
    evidence: 'Moderate',
    pct: 60,
    status: hasConflict ? 'conflict' : 'ok',
    stock: item.daysSupplyRemaining,
    conflictNote,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SearchEmptyState({ query, isEmpty }: { query: string; isEmpty: boolean }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.text}>
        {isEmpty
          ? 'No supplements in your cabinet yet.\nTap "+ Add" to get started.'
          : `No supplements match "${query}"`}
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { paddingTop: 40, alignItems: 'center' },
  text: { ...typography.body, color: colors.text2, textAlign: 'center', lineHeight: 22 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

type ApiItem = CabinetMockItem & { _id: string };

interface ScreenState {
  items: ApiItem[];
  loading: boolean;
  refreshing: boolean;
  usedMock: boolean;
  error: string | null;
}

export default function CabinetScreen() {
  const token = useAuthStore((s) => s.token);

  const [state, setState] = useState<ScreenState>({
    items: [],
    loading: true,
    refreshing: false,
    usedMock: false,
    error: null,
  });
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) {
        setState({
          items: MOCK_DATA.map((m, i) => ({ ...m, _id: `mock-${i}` })),
          loading: false,
          refreshing: false,
          usedMock: true,
          error: null,
        });
        return;
      }

      setState((s) => ({ ...s, loading: !isRefresh, refreshing: isRefresh, error: null }));

      const [itemsRes, interactionsRes] = await Promise.allSettled([
        listAllCabinetItems(token),
        getInteractions(token),
      ]);

      if (itemsRes.status === 'rejected') {
        setState((s) => ({
          ...s,
          loading: false,
          refreshing: false,
          error: 'Could not load cabinet. Pull to refresh.',
        }));
        return;
      }

      const rawItems = itemsRes.value;
      const interactions = interactionsRes.status === 'fulfilled' ? interactionsRes.value : [];

      const activeItems = rawItems.filter((item) => deriveStatus(item) === 'active');
      const cards = activeItems.map((item) => apiItemToCard(item, interactions));

      setState({
        items: cards,
        loading: false,
        refreshing: false,
        usedMock: false,
        error: null,
      });
    },
    [token],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const handleDelete = useCallback(
    (id: string) => {
      // Optimistic removal.
      setState((s) => ({ ...s, items: s.items.filter((item) => item._id !== id) }));
      if (!token || id.startsWith('mock-')) return;
      void deleteCabinetItem(id, token).catch(() => {
        // Reload to restore removed item if delete failed.
        void load(false);
      });
    },
    [token, load],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.items;
    return state.items.filter((item) => item.name.toLowerCase().includes(q));
  }, [search, state.items]);

  const rows = useMemo(() => {
    const pairs: [ApiItem, ApiItem | null][] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      pairs.push([filtered[i], filtered[i + 1] ?? null]);
    }
    return pairs;
  }, [filtered]);

  const activeCount = state.items.length;
  const conflictCount = state.items.filter((x) => x.status === 'conflict').length;

  if (state.loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>
              {activeCount} active · {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
              {state.usedMock && ' · demo'}
            </Text>
            <Text style={styles.headerTitle}>Cabinet</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Add supplement"
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>

        {/* Error banner */}
        {state.error !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}

        {/* Search bar */}
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplements"
            placeholderTextColor={colors.text3}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search supplements"
            testID="cabinet-search"
          />
        </View>

        {/* Grid */}
        {filtered.length > 0 ? (
          <View style={styles.grid}>
            {rows.map(([left, right]) => (
              <View key={left._id} style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <CabinetCard
                    item={left}
                    isExpanded={expandedId === left._id}
                    onToggle={() => setExpandedId((prev) => (prev === left._id ? null : left._id))}
                    onDelete={() => handleDelete(left._id)}
                  />
                </View>
                <View style={styles.gridCell}>
                  {right !== null && (
                    <CabinetCard
                      item={right}
                      isExpanded={expandedId === right._id}
                      onToggle={() => setExpandedId((prev) => (prev === right._id ? null : right._id))}
                      onDelete={() => handleDelete(right._id)}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <SearchEmptyState query={search} isEmpty={state.items.length === 0} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const GRID_GAP = 12;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    paddingBottom: spacing.xxxl,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text2,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    height: 36,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPressed: { opacity: 0.85 },
  addButtonText: { ...typography.bodyStrong, fontSize: 14, color: '#ffffff' },

  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.bodySmall, color: colors.danger },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  searchBarFocused: { borderColor: colors.primary },
  searchIcon: { fontSize: 18, color: colors.text3 },
  searchInput: { flex: 1, ...typography.body, color: colors.text, paddingVertical: 0 },

  grid: { gap: GRID_GAP },
  gridRow: { flexDirection: 'row', gap: GRID_GAP },
  gridCell: { flex: 1, minHeight: 0 },
});
