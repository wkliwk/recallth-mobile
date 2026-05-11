/**
 * Cabinet screen — B·Health 2-column grid rebuild.
 *
 * Displays static mock data in a 2-column card grid with:
 *   - Header: active count · conflict count + "+ Add" button
 *   - Full-width search bar (orange focus border)
 *   - 2-column grid of CabinetCard components
 *   - Card expand/collapse showing stats + action buttons
 *   - Empty search state
 *
 * API wiring deferred to follow-up issue.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CabinetCard } from '../../components/cabinet/CabinetCard';
import type { CabinetMockItem } from '../../components/cabinet/CabinetCard';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Mock data ────────────────────────────────────────────────────────────────

const CABINET_DATA: CabinetMockItem[] = [
  { name: 'Vitamin D3', dose: '2000 IU', schedule: 'Daily · Morning', evidence: 'High', pct: 92, status: 'ok', stock: 24 },
  { name: 'Omega-3 EPA/DHA', dose: '1000 mg', schedule: 'Daily · Morning', evidence: 'High', pct: 95, status: 'ok', stock: 30 },
  { name: 'Creatine monohydrate', dose: '5 g', schedule: 'Daily', evidence: 'High', pct: 96, status: 'ok', stock: 45 },
  { name: 'Magnesium glycinate', dose: '200 mg', schedule: 'Noon + Night', evidence: 'Moderate', pct: 68, status: 'ok', stock: 18 },
  { name: 'Ashwagandha KSM-66', dose: '600 mg', schedule: 'Night', evidence: 'Moderate', pct: 58, status: 'conflict', conflictNote: 'Mild serotonergic — flag if taking SSRI' },
  { name: 'L-theanine', dose: '200 mg', schedule: 'With caffeine', evidence: 'Moderate', pct: 62, status: 'ok', stock: 40 },
  { name: 'B-complex', dose: '1 cap', schedule: 'Noon', evidence: 'Limited', pct: 35, status: 'ok', stock: 60 },
  { name: 'Zinc picolinate', dose: '15 mg', schedule: 'Noon', evidence: 'Moderate', pct: 55, status: 'conflict', conflictNote: 'May reduce Mg absorption — space 2hrs' },
];

// ─── Search empty state ───────────────────────────────────────────────────────

function SearchEmptyState({ query }: { query: string }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.text}>No supplements match &ldquo;{query}&rdquo;</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    paddingTop: 40,
    alignItems: 'center',
  },
  text: {
    ...typography.body,
    color: colors.text2,
    textAlign: 'center',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CabinetScreen() {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedName, setExpandedName] = useState<string | null>(null);

  const activeCount = CABINET_DATA.length;
  const conflictCount = CABINET_DATA.filter((x) => x.status === 'conflict').length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CABINET_DATA;
    return CABINET_DATA.filter((item) => item.name.toLowerCase().includes(q));
  }, [search]);

  const handleToggle = useCallback((name: string) => {
    setExpandedName((prev) => (prev === name ? null : name));
  }, []);

  // Build pairs for the 2-column grid layout
  const rows = useMemo(() => {
    const pairs: [CabinetMockItem, CabinetMockItem | null][] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      pairs.push([filtered[i], filtered[i + 1] ?? null]);
    }
    return pairs;
  }, [filtered]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>
              {activeCount} active · {conflictCount} conflicts
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

        {/* Search bar */}
        <View
          style={[
            styles.searchBar,
            searchFocused && styles.searchBarFocused,
          ]}
        >
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
              <View key={left.name} style={styles.gridRow}>
                <View style={styles.gridCell}>
                  <CabinetCard
                    item={left}
                    isExpanded={expandedName === left.name}
                    onToggle={() => handleToggle(left.name)}
                  />
                </View>
                <View style={styles.gridCell}>
                  {right !== null && (
                    <CabinetCard
                      item={right}
                      isExpanded={expandedName === right.name}
                      onToggle={() => handleToggle(right.name)}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <SearchEmptyState query={search} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const GRID_GAP = 12;

const styles = StyleSheet.create({
  container: {
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

  // Header
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
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: '#ffffff',
  },

  // Search
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
  searchBarFocused: {
    borderColor: colors.primary,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.text3,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },

  // Grid
  grid: {
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  gridCell: {
    flex: 1,
    minHeight: 0,
  },
});
