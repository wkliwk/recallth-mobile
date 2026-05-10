/**
 * Cabinet screen — Supplement Cabinet with full CRUD.
 *
 * Layout:
 *   - Search bar (filters across all groups)
 *   - Grouped SectionList: Active (default expanded) / Paused / Stopped
 *   - Each item: SupplementCard with severity badge if interactions exist
 *   - FAB (green) → AddSheet modal
 *   - Empty state CTA → Chat tab
 *   - Loading: skeleton cards
 *   - Error: retry CTA
 *
 * Optimistic updates: add/edit/delete update the store immediately, rollback on error.
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddSheet } from '../../components/cabinet/AddSheet';
import { SupplementCard } from '../../components/cabinet/SupplementCard';
import { FAB } from '../../components/ui/FAB';
import { SeverityLevel } from '../../components/ui/SeverityBadge';
import {
  CabinetItem,
  CreateCabinetItemInput,
  SupplementStatus,
  deriveStatus,
  statusToFields,
} from '../../services/cabinet';
import { useCabinetStore } from '../../stores/cabinet';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKey = 'Active' | 'Paused' | 'Stopped';

type CabinetSection = {
  title: SectionKey;
  data: CabinetItem[];
  collapsed: boolean;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <View style={skeletonStyles.card} accessibilityLabel="Loading">
      <View style={skeletonStyles.iconTile} />
      <View style={skeletonStyles.content}>
        <View style={skeletonStyles.nameLine} />
        <View style={skeletonStyles.doseLine} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cardSolid,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  nameLine: {
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.cardSolid,
    width: '60%',
  },
  doseLine: {
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.cardSolid,
    width: '40%',
  },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onTellAI }: { onTellAI: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.illustration}>💊</Text>
      <Text style={emptyStyles.title}>Your cabinet is empty</Text>
      <Text style={emptyStyles.body}>
        Add your supplements and medications so we can check interactions and personalize advice.
      </Text>
      <Pressable
        onPress={onTellAI}
        style={({ pressed }) => [emptyStyles.cta, pressed && emptyStyles.ctaPressed]}
        accessibilityRole="button"
        accessibilityLabel="Tell the AI what you take"
      >
        <Text style={emptyStyles.ctaText}>Tell the AI what you take →</Text>
      </Pressable>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    paddingTop: 60,
  },
  illustration: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 22,
  },
  cta: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryMid,
    marginTop: spacing.sm,
  },
  ctaPressed: {
    opacity: 0.80,
  },
  ctaText: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
});

// ─── Section header ───────────────────────────────────────────────────────────

type SectionHeaderProps = {
  title: SectionKey;
  count: number;
  collapsed: boolean;
  onToggle: (key: SectionKey) => void;
};

function SectionHeader({ title, count, collapsed, onToggle }: SectionHeaderProps) {
  return (
    <Pressable
      onPress={() => onToggle(title)}
      style={({ pressed }) => [sectionStyles.header, pressed && sectionStyles.headerPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title} section, ${count} items, ${collapsed ? 'collapsed' : 'expanded'}`}
    >
      <View style={sectionStyles.left}>
        <Text style={sectionStyles.title}>{title}</Text>
        <View style={sectionStyles.countBadge}>
          <Text style={sectionStyles.count}>{count}</Text>
        </View>
      </View>
      <Text style={sectionStyles.chevron}>{collapsed ? '›' : '⌄'}</Text>
    </Pressable>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  headerPressed: {
    opacity: 0.7,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: colors.cardSolid,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  count: {
    ...typography.caption,
    color: colors.text2,
  },
  chevron: {
    fontSize: 18,
    color: colors.text3,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CabinetScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const { items, interactionMap, loadingState, error, fetch, add, update, remove } =
    useCabinetStore();

  const [search, setSearch] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CabinetItem | null>(null);

  // Collapsed state: Active expanded by default, Paused/Stopped collapsed.
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    Active: false,
    Paused: true,
    Stopped: true,
  });

  // Fetch on mount.
  useEffect(() => {
    if (token) {
      void fetch(token);
    }
  }, [token, fetch]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.brand?.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.dosage?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const sections = useMemo<CabinetSection[]>(() => {
    const groups: Record<SupplementStatus, CabinetItem[]> = {
      active: [],
      paused: [],
      stopped: [],
    };

    for (const item of filteredItems) {
      groups[deriveStatus(item)].push(item);
    }

    const result: CabinetSection[] = [];
    if (groups.active.length > 0) {
      result.push({ title: 'Active', data: groups.active, collapsed: collapsed['Active'] });
    }
    if (groups.paused.length > 0) {
      result.push({ title: 'Paused', data: groups.paused, collapsed: collapsed['Paused'] });
    }
    if (groups.stopped.length > 0) {
      result.push({ title: 'Stopped', data: groups.stopped, collapsed: collapsed['Stopped'] });
    }
    return result;
  }, [filteredItems, collapsed]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleSection = useCallback((key: SectionKey) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const openAddSheet = useCallback(() => {
    setEditingItem(null);
    setSheetVisible(true);
  }, []);

  const openEditSheet = useCallback((item: CabinetItem) => {
    setEditingItem(item);
    setSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setEditingItem(null);
  }, []);

  const handleSave = useCallback(
    async (input: CreateCabinetItemInput) => {
      if (!token) return;

      if (editingItem) {
        await update(editingItem._id, input, token);
      } else {
        await add(input, token);
        // Expand Active section to show the new item.
        setCollapsed((prev) => ({ ...prev, Active: false }));
      }
    },
    [token, editingItem, update, add],
  );

  const handleDelete = useCallback(
    (item: CabinetItem) => {
      if (!token) return;
      void remove(item._id, token).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Delete failed';
        Alert.alert('Error', msg);
      });
    },
    [token, remove],
  );

  const handleTellAI = useCallback(() => {
    router.push('/(tabs)');
  }, [router]);

  const handleRetry = useCallback(() => {
    if (token) void fetch(token);
  }, [token, fetch]);

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: CabinetItem }) => {
      const severity = interactionMap[item.name.toLowerCase()] as SeverityLevel | undefined;
      return (
        <SupplementCard
          item={item}
          interactionSeverity={severity}
          onPress={openEditSheet}
          onDelete={handleDelete}
          testID={`supplement-card-${item._id}`}
        />
      );
    },
    [interactionMap, openEditSheet, handleDelete],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<CabinetItem, CabinetSection> }) => {
      const s = section as CabinetSection;
      return (
        <SectionHeader
          title={s.title}
          count={s.data.length}
          collapsed={s.collapsed}
          onToggle={toggleSection}
        />
      );
    },
    [toggleSection],
  );

  // When a section is collapsed, return a null item so the SectionList
  // renders the header but no items.
  const getSectionData = useCallback(
    (section: CabinetSection): CabinetItem[] => (section.collapsed ? [] : section.data),
    [],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  const isLoading = loadingState === 'loading' && items.length === 0;
  const hasError = loadingState === 'error';
  const isEmpty = !isLoading && !hasError && items.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search supplements..."
            placeholderTextColor={colors.text3}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search supplements"
            testID="search-bar"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      )}

      {/* Error */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error ?? 'Failed to load your cabinet. Check your connection.'}
          </Text>
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Retry loading"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Empty state */}
      {isEmpty && <EmptyState onTellAI={handleTellAI} />}

      {/* List */}
      {!isLoading && !hasError && items.length > 0 && (
        <SectionList
          sections={sections.map((s) => ({ ...s, data: getSectionData(s) }))}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            search.trim()
              ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>
                    No results for &quot;{search}&quot;
                  </Text>
                </View>
              )
              : null
          }
        />
      )}

      {/* FAB */}
      <FAB
        onPress={openAddSheet}
        variant="green"
        accessibilityLabel="Add supplement"
      />

      {/* Add / Edit sheet */}
      <AddSheet
        visible={sheetVisible}
        onClose={closeSheet}
        onSave={handleSave}
        item={editingItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenPad,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.text3,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.text3,
  },
  listContent: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.sm,
    paddingBottom: 120, // Space for FAB.
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.dangerMid,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.danger,
  },
  noResults: {
    paddingTop: 40,
    alignItems: 'center',
  },
  noResultsText: {
    ...typography.body,
    color: colors.text3,
    textAlign: 'center',
  },
});
