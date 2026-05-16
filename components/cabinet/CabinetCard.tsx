import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { EvidenceBar } from './EvidenceBar';
import { SideEffectSheet } from './SideEffectSheet';
import { type DeepResearch, getSupplementResearch } from '../../services/cabinet';
import { type SideEffectEntry, getSideEffects } from '../../services/sideEffects';
import { useAuthStore } from '../../stores/auth';

const RATING_LABELS: Record<number, string> = {
  1: 'Mild', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Severe',
};

export type EvidenceLevel = 'High' | 'Moderate' | 'Limited';
export type SupplementStatus = 'ok' | 'conflict';

export interface ResearchNotes {
  summary: string;
  commonDosage: string;
  cautions: string;
}

export interface CabinetMockItem {
  id: string;
  name: string;
  dose: string;
  schedule: string;
  evidence: EvidenceLevel;
  pct: number;
  status: SupplementStatus;
  stock?: number;
  quantityRemaining?: number;
  dailyDoseCount?: number;
  conflictNote?: string;
  startDate?: string;
  researchNotes?: ResearchNotes;
}

interface CabinetCardProps {
  item: CabinetMockItem;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onUpdateStock?: (delta: number) => void;
}

export function CabinetCard({ item, isExpanded, onToggle, onDelete, onEdit, onUpdateStock }: CabinetCardProps) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [sideEffectSheetVisible, setSideEffectSheetVisible] = useState(false);
  const [deepResearch, setDeepResearch] = useState<DeepResearch | null>(null);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [sideEffects, setSideEffects] = useState<SideEffectEntry[]>([]);
  const sideEffectsLoaded = useRef(false);
  const [localStock, setLocalStock] = useState<number | undefined>(item.stock);
  const stockDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load side effects once when card first expands
  useEffect(() => {
    if (!isExpanded || sideEffectsLoaded.current || !token || item.id.startsWith('mock-')) return;
    sideEffectsLoaded.current = true;
    void getSideEffects(token, item.id, 5).then(setSideEffects).catch(() => {/* non-critical */});
  }, [isExpanded, token, item.id]);

  const handleFetchResearch = useCallback(async () => {
    if (deepResearch !== null || loadingResearch || !token) return;
    setLoadingResearch(true);
    setResearchError(null);
    try {
      const { research, generating } = await getSupplementResearch(item.id, token);
      if (research) {
        setDeepResearch(research);
      } else if (generating) {
        setResearchError('Generating… check back in a moment.');
        // Poll once after 3s
        setTimeout(() => {
          void getSupplementResearch(item.id, token).then(({ research: r }) => {
            if (r) setDeepResearch(r);
            else setResearchError('Still generating. Tap Research again shortly.');
          }).catch(() => setResearchError('Could not load research.'));
        }, 3000);
      } else {
        setResearchError('No research available yet.');
      }
    } catch {
      setResearchError('Failed to load research.');
    } finally {
      setLoadingResearch(false);
    }
  }, [deepResearch, loadingResearch, token, item.id]);

  const refreshSideEffects = useCallback(() => {
    if (!token || item.id.startsWith('mock-')) return;
    void getSideEffects(token, item.id, 5).then(setSideEffects).catch(() => {/* non-critical */});
  }, [token, item.id]);

  const handleStockChange = useCallback((delta: number) => {
    setLocalStock((prev) => {
      const current = prev ?? 0;
      const next = Math.max(0, current + delta);
      if (stockDebounce.current) clearTimeout(stockDebounce.current);
      stockDebounce.current = setTimeout(() => {
        onUpdateStock?.(delta);
      }, 800);
      return next;
    });
  }, [onUpdateStock]);

  return (
    <>
    <SideEffectSheet
      visible={sideEffectSheetVisible}
      cabinetItemId={item.id}
      supplementName={item.name}
      onClose={() => {
        setSideEffectSheetVisible(false);
        refreshSideEffects();
      }}
    />
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.card,
        isExpanded && styles.cardExpanded,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.dose}, ${item.schedule}${item.status === 'conflict' ? ', conflict' : ''}`}
      accessibilityHint={isExpanded ? 'Tap to collapse details' : 'Tap to expand details'}
    >
      {/* Top row: avatar + info */}
      <View style={styles.topRow}>
        {/* Letter avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{item.name[0]}</Text>
        </View>

        {/* Name, dose, conflict pill */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            {item.status === 'conflict' && (
              <View style={styles.conflictPill}>
                <View style={styles.conflictDot} />
                <Text style={styles.conflictPillText}>Conflict</Text>
              </View>
            )}
          </View>
          <Text style={styles.dose}>{item.dose} · {item.schedule}</Text>

          {/* Evidence bar */}
          <EvidenceBar level={item.evidence} pct={item.pct} />
        </View>
      </View>

      {/* Expanded panel */}
      {isExpanded && (
        <View style={styles.expandedPanel}>
          <View style={styles.divider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>STOCK</Text>
              <View style={styles.stockRow}>
                <Text style={styles.statValue}>
                  {localStock !== undefined ? `${localStock}d` : '—'}
                </Text>
                {onUpdateStock !== undefined && (
                  <View style={styles.stockStepper}>
                    <Pressable
                      style={({ pressed }) => [styles.stepperBtn, pressed && styles.stepperBtnPressed]}
                      onPress={() => handleStockChange(-1)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove 1 day of stock"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={styles.stepperBtnText}>−</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.stepperBtn, styles.stepperBtnAdd, pressed && styles.stepperBtnPressed]}
                      onPress={() => handleStockChange(30)}
                      accessibilityRole="button"
                      accessibilityLabel="Add 30 days of stock"
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Text style={[styles.stepperBtnText, styles.stepperBtnAddText]}>+30</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>SINCE</Text>
              <Text style={styles.statValue}>
                {item.startDate
                  ? new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Conflict note */}
          {item.status === 'conflict' && item.conflictNote !== undefined && (
            <View style={styles.conflictNote}>
              <Text style={styles.conflictNoteText}>⚠ {item.conflictNote}</Text>
            </View>
          )}

          {/* Research notes (AI summary from cabinet item) */}
          {item.researchNotes !== undefined && (
            <View style={styles.researchSection}>
              <Text style={styles.researchLabel}>Research</Text>
              <Text style={styles.researchText}>{item.researchNotes.summary}</Text>
              {item.researchNotes.commonDosage.length > 0 && (
                <Text style={styles.researchMeta}>Typical dose: {item.researchNotes.commonDosage}</Text>
              )}
              {item.researchNotes.cautions.length > 0 && (
                <Text style={styles.researchCautions}>⚠ {item.researchNotes.cautions}</Text>
              )}
            </View>
          )}

          {/* Side effects history */}
          {(isExpanded && !item.id.startsWith('mock-')) && (
            <View style={styles.sideEffectsSection}>
              <Text style={styles.sideEffectsLabel}>Side Effect History</Text>
              {sideEffects.length === 0 ? (
                <Text style={styles.sideEffectsEmpty}>No side effects logged yet.</Text>
              ) : (
                sideEffects.slice(0, 5).map((se) => (
                  <View key={se._id} style={styles.sideEffectRow}>
                    <View style={styles.sideEffectRating}>
                      <Text style={styles.sideEffectRatingText}>{se.rating}</Text>
                    </View>
                    <View style={styles.sideEffectInfo}>
                      <Text style={styles.sideEffectSymptom}>{se.symptom}</Text>
                      <Text style={styles.sideEffectDate}>
                        {RATING_LABELS[se.rating] ?? 'Unknown'} · {new Date(se.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* Deep research panel */}
          {deepResearch !== null && (
            <View style={styles.deepResearchSection}>
              <Text style={styles.deepResearchLabel}>Deep Research</Text>
              <Text style={styles.deepResearchSummary}>{deepResearch.summary}</Text>
              <View style={styles.deepResearchMeta}>
                {deepResearch.keyStudiesCount > 0 && (
                  <Text style={styles.deepResearchMetaText}>
                    {deepResearch.keyStudiesCount} key {deepResearch.keyStudiesCount === 1 ? 'study' : 'studies'}
                  </Text>
                )}
                {deepResearch.dosageRange.length > 0 && (
                  <Text style={styles.deepResearchMetaText}>Dosage: {deepResearch.dosageRange}</Text>
                )}
              </View>
              {deepResearch.safetyNotes.length > 0 && (
                <Text style={styles.deepResearchCautions}>⚠ {deepResearch.safetyNotes}</Text>
              )}
              {deepResearch.sources.length > 0 && (
                <View style={styles.sourcesRow}>
                  {deepResearch.sources.slice(0, 4).map((src, i) => {
                    const domain = src.replace(/^https?:\/\//, '').split('/')[0] ?? src;
                    return (
                      <View key={i} style={styles.sourceChip}>
                        <Text style={styles.sourceChipText}>{domain}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
          {researchError !== null && (
            <Text style={styles.researchErrorText}>{researchError}</Text>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
              onPress={onEdit}
            >
              <Text style={styles.actionBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`History for ${item.name}`}
              onPress={() => router.push('/(tabs)/history' as Parameters<typeof router.push>[0])}
            >
              <Text style={styles.actionBtnText}>History</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Deep research for ${item.name}`}
              onPress={() => { void handleFetchResearch(); }}
              disabled={loadingResearch}
            >
              {loadingResearch
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.actionBtnText}>Research</Text>}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Log side effect for ${item.name}`}
              onPress={() => setSideEffectSheetVisible(true)}
            >
              <Text style={styles.actionBtnText}>Log Effect</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
              onPress={onDelete}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardExpanded: {
    borderColor: colors.primary,
  },
  cardPressed: {
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 22,
    color: colors.text2,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  dose: {
    fontSize: 12,
    color: colors.text2,
    marginTop: 3,
    fontWeight: '400',
  },
  conflictPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
  conflictDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  conflictPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },

  // Expanded panel
  expandedPanel: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  stockStepper: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  stepperBtn: {
    height: 24,
    minWidth: 24,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnAdd: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '60',
  },
  stepperBtnPressed: {
    opacity: 0.6,
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text2,
    lineHeight: 16,
  },
  stepperBtnAddText: {
    color: colors.primary,
  },
  conflictNote: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
  },
  conflictNoteText: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },
  researchSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  researchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  researchText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  researchMeta: {
    fontSize: 12,
    color: colors.text2,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  researchCautions: {
    fontSize: 12,
    color: colors.warning,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerMid,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtnTextDanger: {
    color: colors.danger,
  },

  // Deep research
  deepResearchSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  deepResearchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  deepResearchSummary: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  deepResearchMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  deepResearchMetaText: {
    fontSize: 12,
    color: colors.text2,
  },
  deepResearchCautions: {
    fontSize: 12,
    color: colors.warning,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sourceChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sourceChipText: {
    fontSize: 10,
    color: colors.text3,
  },
  researchErrorText: {
    fontSize: 12,
    color: colors.text3,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Side effects
  sideEffectsSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  sideEffectsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  sideEffectsEmpty: {
    fontSize: 12,
    color: colors.text3,
    fontStyle: 'italic',
  },
  sideEffectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sideEffectRating: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warning + '30',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sideEffectRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  sideEffectInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideEffectSymptom: {
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  sideEffectDate: {
    fontSize: 11,
    color: colors.text3,
    marginLeft: spacing.xs,
  },
});
