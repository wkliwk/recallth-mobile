import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddSheet } from '../../components/cabinet/AddSheet';
import { CabinetCard } from '../../components/cabinet/CabinetCard';
import { FirstRunNudge } from '../../components/cabinet/FirstRunNudge';
import { RecommendationsBanner } from '../../components/cabinet/RecommendationsBanner';
import { SupplementDetailSheet } from '../../components/cabinet/SupplementDetailSheet';
import type { CabinetMockItem } from '../../components/cabinet/CabinetCard';
import {
  createCabinetItem,
  deleteCabinetItem,
  deriveStatus,
  getEvidenceScores,
  getInteractions,
  getRestockAlerts,
  listAllCabinetItems,
  updateCabinetItem,
  type CabinetItem,
  type CreateCabinetItemInput,
  type EvidenceScore,
  type Interaction,
  type RestockAlert,
  type UpdateCabinetItemInput,
} from '../../services/cabinet';
import { getRecommendations, type Recommendation } from '../../services/recommendations';
import { useAuthStore } from '../../stores/auth';
import * as storage from '../../services/storage';
import { colors, radius, spacing, typography } from '../../utils/theme';

const CABINET_ORDER_KEY = 'recallth:cabinet-order';

// ─── Mock fallback (unauthenticated / demo) ───────────────────────────────────

const MOCK_DATA: CabinetMockItem[] = [
  { id: 'mock-1', name: 'Vitamin D3', dose: '2000 IU', schedule: 'Daily · Morning', evidence: 'High', pct: 92, status: 'ok', stock: 24 },
  { id: 'mock-2', name: 'Omega-3 EPA/DHA', dose: '1000 mg', schedule: 'Daily · Morning', evidence: 'High', pct: 95, status: 'ok', stock: 30 },
  { id: 'mock-3', name: 'Creatine monohydrate', dose: '5 g', schedule: 'Daily', evidence: 'High', pct: 96, status: 'ok', stock: 45 },
  { id: 'mock-4', name: 'Magnesium glycinate', dose: '200 mg', schedule: 'Noon + Night', evidence: 'Moderate', pct: 68, status: 'ok', stock: 18 },
  { id: 'mock-5', name: 'Ashwagandha KSM-66', dose: '600 mg', schedule: 'Night', evidence: 'Moderate', pct: 58, status: 'conflict', conflictNote: 'Mild serotonergic — flag if taking SSRI' },
  { id: 'mock-6', name: 'L-theanine', dose: '200 mg', schedule: 'With caffeine', evidence: 'Moderate', pct: 62, status: 'ok', stock: 40 },
  { id: 'mock-7', name: 'B-complex', dose: '1 cap', schedule: 'Noon', evidence: 'Limited', pct: 35, status: 'ok', stock: 60 },
  { id: 'mock-8', name: 'Zinc picolinate', dose: '15 mg', schedule: 'Noon', evidence: 'Moderate', pct: 55, status: 'conflict', conflictNote: 'May reduce Mg absorption — space 2hrs' },
];

// ─── API → card adapter ───────────────────────────────────────────────────────

import type { EvidenceLevel } from '../../components/cabinet/CabinetCard';

function gradeToEvidence(grade: string | undefined): { evidence: EvidenceLevel; pct: number } {
  if (grade === 'A') return { evidence: 'High', pct: 90 };
  if (grade === 'B') return { evidence: 'Moderate', pct: 65 };
  if (grade === 'C') return { evidence: 'Limited', pct: 35 };
  return { evidence: 'Limited', pct: 10 };
}

function apiItemToCard(item: CabinetItem, interactions: Interaction[], evidenceScores: EvidenceScore[]): ApiItem {
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

  const score = evidenceScores.find((s) => s.name.toLowerCase() === item.name.toLowerCase());
  const { evidence, pct } = score ? gradeToEvidence(score.level) : { evidence: 'Moderate' as EvidenceLevel, pct: 60 };

  return {
    id: item._id,
    _id: item._id,
    name: item.name,
    dose: item.dosage ?? '—',
    schedule,
    evidence,
    pct,
    status: hasConflict ? 'conflict' : 'ok',
    stock: item.daysSupplyRemaining,
    quantityRemaining: item.quantityRemaining,
    dailyDoseCount: item.dailyDoseCount,
    conflictNote,
    startDate: item.startDate,
    researchNotes: item.researchNotes,
    isPaused: item.isPaused,
    pausedUntil: item.pausedUntil,
    _source: item,
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

type ApiItem = CabinetMockItem & { _id: string; _source?: CabinetItem };

interface ScreenState {
  items: ApiItem[];
  restockAlerts: RestockAlert[];
  loading: boolean;
  refreshing: boolean;
  usedMock: boolean;
  error: string | null;
}

export default function CabinetScreen() {
  const token = useAuthStore((s) => s.token);

  const [state, setState] = useState<ScreenState>({
    items: [],
    restockAlerts: [],
    loading: true,
    refreshing: false,
    usedMock: false,
    error: null,
  });
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { openAdd } = useLocalSearchParams<{ openAdd?: string }>();
  const [showAddSheet, setShowAddSheet] = useState(openAdd === '1');
  const [reorderMode, setReorderMode] = useState(false);
  const [editingItem, setEditingItem] = useState<CabinetItem | null>(null);
  const [detailItem, setDetailItem] = useState<CabinetItem | null>(null);
  const [restockDismissed, setRestockDismissed] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dismissedRecs, setDismissedRecs] = useState<string[]>([]);
  const [prefillRec, setPrefillRec] = useState<Recommendation | null>(null);

  const load = useCallback(
    async (isRefresh = false, isSilent = false) => {
      if (!token) {
        setState({
          items: MOCK_DATA.map((m, i) => ({ ...m, _id: `mock-${i}` })),
          restockAlerts: [],
          loading: false,
          refreshing: false,
          usedMock: true,
          error: null,
        });
        return;
      }

      setState((s) => ({ ...s, loading: !isRefresh && !isSilent, refreshing: isRefresh, error: null }));

      const [itemsRes, interactionsRes, evidenceRes, restockRes] = await Promise.allSettled([
        listAllCabinetItems(token),
        getInteractions(token),
        getEvidenceScores(token),
        getRestockAlerts(token),
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
      const evidenceScores = evidenceRes.status === 'fulfilled' ? evidenceRes.value : [];
      const restockAlerts = restockRes.status === 'fulfilled' ? restockRes.value : [];

      const activeItems = rawItems.filter((item) => deriveStatus(item) === 'active');
      const cards = activeItems.map((item) => apiItemToCard(item, interactions, evidenceScores));

      // Apply saved sort order
      const orderRaw = await storage.getItem(CABINET_ORDER_KEY).catch(() => null);
      let orderedCards = cards;
      if (orderRaw) {
        try {
          const order: string[] = JSON.parse(orderRaw);
          orderedCards = [
            ...order.map((id) => cards.find((c) => c._id === id)).filter(Boolean) as typeof cards,
            ...cards.filter((c) => !order.includes(c._id)),
          ];
        } catch { /* use original order */ }
      }

      setState({
        items: orderedCards,
        restockAlerts,
        loading: false,
        refreshing: false,
        usedMock: false,
        error: null,
      });
    },
    [token],
  );

  const cabinetInitDone = useRef(false);

  useEffect(() => {
    void load(false);
    cabinetInitDone.current = true;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      if (!cabinetInitDone.current) return;
      void load(false, true);
    }, [load]),
  );

  useEffect(() => {
    if (!token) return;
    void getRecommendations(token).then(setRecommendations).catch(() => {/* non-critical */});
    const userId = token.slice(-8);
    void (async () => {
      const stored = await storage.getItem(`recallth:recs-dismissed:${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{ name: string; at: number }>;
        const now = Date.now();
        const active = parsed.filter((d) => now - d.at < 86_400_000).map((d) => d.name);
        setDismissedRecs(active);
      }
    })();
  }, [token]);

  const handleAdd = useCallback(
    async (input: CreateCabinetItemInput) => {
      if (!token) return;
      const newItem = await createCabinetItem(input, token);
      const [interactions, evidenceScores] = await Promise.all([
        getInteractions(token).catch(() => [] as Interaction[]),
        getEvidenceScores(token).catch(() => [] as EvidenceScore[]),
      ]);
      const card = apiItemToCard(newItem, interactions, evidenceScores);
      setState((s) => ({ ...s, items: [...s.items, card] }));
      // Append new item to saved order
      const orderRaw = await storage.getItem(CABINET_ORDER_KEY).catch(() => null);
      const order: string[] = orderRaw ? JSON.parse(orderRaw) : [];
      void storage.setItem(CABINET_ORDER_KEY, JSON.stringify([...order, newItem._id]));

      // Alert if the newly added item has any interactions
      const newItemConflicts = interactions.filter(
        (ix) => ix.item1 === newItem._id || ix.item2 === newItem._id,
      );
      if (newItemConflicts.length > 0) {
        const details = newItemConflicts
          .map((ix) => `• [${ix.severity}] ${ix.description}`)
          .join('\n');
        Alert.alert(
          '⚠ Interaction Detected',
          `${newItem.name} may interact with supplements already in your cabinet:\n\n${details}`,
          [{ text: 'OK' }],
        );
      }
    },
    [token],
  );

  const handleUpdate = useCallback(
    async (input: CreateCabinetItemInput) => {
      if (!token || !editingItem) return;
      const updated = await updateCabinetItem(editingItem._id, input, token);
      const [interactions, evidenceScores] = await Promise.all([
        getInteractions(token).catch(() => [] as Interaction[]),
        getEvidenceScores(token).catch(() => [] as EvidenceScore[]),
      ]);
      const card = apiItemToCard(updated, interactions, evidenceScores);
      setState((s) => ({
        ...s,
        items: s.items.map((item) => (item._id === updated._id ? card : item)),
      }));
    },
    [token, editingItem],
  );

  const handleUpdateStock = useCallback(
    (id: string, deltadays: number) => {
      if (!token || id.startsWith('mock-')) return;
      setState((s) => {
        const item = s.items.find((x) => x._id === id);
        if (!item) return s;
        const dailyDoseCount = item._source?.dailyDoseCount ?? 1;
        const currentQty = item._source?.quantityRemaining ?? 0;
        const newQty = Math.max(0, currentQty + deltadays * dailyDoseCount);
        const newDaysSupply = dailyDoseCount > 0 ? Math.floor(newQty / dailyDoseCount) : 0;
        const updatedSource = item._source
          ? { ...item._source, quantityRemaining: newQty, daysSupplyRemaining: newDaysSupply }
          : item._source;
        const updatedItem: typeof item = { ...item, stock: newDaysSupply, _source: updatedSource };
        void updateCabinetItem(id, { quantityRemaining: newQty }, token).catch(() => {
          void load(false, true);
        });
        return { ...s, items: s.items.map((x) => (x._id === id ? updatedItem : x)) };
      });
    },
    [token, load],
  );

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

  const handleDetailUpdated = useCallback(
    (updated: CabinetItem) => {
      setState((s) => ({
        ...s,
        items: s.items.map((x) =>
          x._id === updated._id
            ? { ...x, _source: updated, dose: updated.dosage ?? x.dose }
            : x,
        ),
      }));
      setDetailItem(updated);
    },
    [],
  );

  const handleDismissRec = useCallback(
    async (name: string) => {
      setDismissedRecs((prev) => [...prev, name]);
      if (!token) return;
      const userId = token.slice(-8);
      const key = `recallth:recs-dismissed:${userId}`;
      const stored = await storage.getItem(key);
      const existing: Array<{ name: string; at: number }> = stored ? (JSON.parse(stored) as Array<{ name: string; at: number }>) : [];
      const updated = [...existing.filter((d) => d.name !== name), { name, at: Date.now() }];
      await storage.setItem(key, JSON.stringify(updated));
    },
    [token],
  );

  const handleSelectRec = useCallback((rec: Recommendation) => {
    setPrefillRec(rec);
    setShowAddSheet(true);
  }, []);

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
        keyboardDismissMode="on-drag"
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
          <View style={styles.headerActions}>
            {activeCount > 1 && !search && (
              <Pressable
                style={({ pressed }) => [styles.reorderBtn, reorderMode && styles.reorderBtnActive, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={reorderMode ? 'Done reordering' : 'Reorder supplements'}
                onPress={() => setReorderMode((v) => !v)}
              >
                <Text style={[styles.reorderBtnText, reorderMode && styles.reorderBtnTextActive]}>
                  {reorderMode ? 'Done' : '⇅ Reorder'}
                </Text>
              </Pressable>
            )}
            {!reorderMode && (
              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Add supplement"
                onPress={() => setShowAddSheet(true)}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Error banner */}
        {state.error !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}

        {/* Restock alerts banner */}
        {!restockDismissed && state.restockAlerts.length > 0 && (
          <View style={styles.restockBanner}>
            <View style={styles.restockContent}>
              <Text style={styles.restockTitle}>⚠ Running low</Text>
              <Text style={styles.restockText}>
                {state.restockAlerts.map((a) => `${a.name} (${a.daysSupplyRemaining}d)`).join(' · ')}
              </Text>
            </View>
            <Pressable
              onPress={() => setRestockDismissed(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Dismiss restock alert"
            >
              <Text style={styles.restockDismiss}>✕</Text>
            </Pressable>
          </View>
        )}

        {/* Recommendations */}
        {!state.usedMock && recommendations.length > 0 && (
          <RecommendationsBanner
            recommendations={recommendations}
            dismissed={dismissedRecs}
            onDismiss={(name) => { void handleDismissRec(name); }}
            onSelect={handleSelectRec}
          />
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

        {/* First-run nudge for authenticated users with empty cabinet */}
        {!state.usedMock && state.items.length === 0 && !search && !state.loading && (
          <FirstRunNudge onAdd={() => setShowAddSheet(true)} />
        )}

        {/* Reorder mode — single column DraggableFlatList */}
        {reorderMode && state.items.length > 0 && (
          <DraggableFlatList
            data={state.items}
            keyExtractor={(item) => item._id}
            onDragEnd={({ data }) => {
              setState((s) => ({ ...s, items: data }));
              void storage.setItem(CABINET_ORDER_KEY, JSON.stringify(data.map((d) => d._id)));
            }}
            renderItem={({ item, drag, isActive }: RenderItemParams<ApiItem>) => (
              <Pressable
                onLongPress={drag}
                style={[styles.reorderRow, isActive && styles.reorderRowActive]}
                accessibilityRole="none"
                accessibilityLabel={`${item.name} — long press to drag`}
              >
                <Text style={styles.reorderHandle}>☰</Text>
                <Text style={styles.reorderName}>{item.name}</Text>
                <Text style={styles.reorderDose}>{item.dose}</Text>
              </Pressable>
            )}
            containerStyle={{ marginHorizontal: spacing.screenPad }}
          />
        )}

        {/* Grid */}
        {!reorderMode && filtered.length > 0 ? (
          <View style={styles.grid}>
            {rows.map(([left, right]) => (
              <View key={left._id} style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <CabinetCard
                    item={left}
                    isExpanded={expandedId === left._id}
                    onToggle={() => setExpandedId((prev) => (prev === left._id ? null : left._id))}
                    onDelete={() => handleDelete(left._id)}
                    onEdit={left._source ? () => setEditingItem(left._source!) : undefined}
                    onUpdateStock={left._source ? (delta) => handleUpdateStock(left._id, delta) : undefined}
                    onViewDetail={left._source ? () => setDetailItem(left._source!) : undefined}
                  />
                </View>
                <View style={styles.gridCell}>
                  {right !== null && (
                    <CabinetCard
                      item={right}
                      isExpanded={expandedId === right._id}
                      onToggle={() => setExpandedId((prev) => (prev === right._id ? null : right._id))}
                      onDelete={() => handleDelete(right._id)}
                      onEdit={right._source ? () => setEditingItem(right._source!) : undefined}
                      onUpdateStock={right._source ? (delta) => handleUpdateStock(right._id, delta) : undefined}
                      onViewDetail={right._source ? () => setDetailItem(right._source!) : undefined}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : search ? (
          <SearchEmptyState query={search} isEmpty={false} />
        ) : null}
      </ScrollView>

      <AddSheet
        visible={showAddSheet}
        onClose={() => { setShowAddSheet(false); setPrefillRec(null); }}
        onSave={handleAdd}
        prefill={prefillRec ?? undefined}
        existingItems={state.items}
      />
      <AddSheet
        visible={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdate}
        item={editingItem}
        existingItems={state.items}
      />
      {token !== null && (
        <SupplementDetailSheet
          visible={detailItem !== null}
          item={detailItem}
          token={token}
          onClose={() => setDetailItem(null)}
          onUpdated={handleDetailUpdated}
          onStockChange={detailItem ? (_, delta) => handleUpdateStock(detailItem._id, delta) : undefined}
          currentStock={
            detailItem
              ? state.items.find((x) => x._id === detailItem._id)?.stock
              : undefined
          }
        />
      )}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reorderBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  reorderBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '40',
  },
  reorderBtnText: { fontSize: 13, fontWeight: '600', color: colors.text2 },
  reorderBtnTextActive: { color: colors.primary },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  reorderRowActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  reorderHandle: { fontSize: 18, color: colors.text3 },
  reorderName: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  reorderDose: { ...typography.caption, color: colors.text3 },

  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.bodySmall, color: colors.danger },

  restockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  restockContent: { flex: 1 },
  restockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 2,
  },
  restockText: { ...typography.bodySmall, color: colors.text2, lineHeight: 18 },
  restockDismiss: { fontSize: 14, color: colors.text3, fontWeight: '600' },

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
