import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { updateCabinetItem, pauseCabinetItem, unpauseCabinetItem, type CabinetItem } from '../../services/cabinet';
import { getSideEffects, type SideEffectEntry } from '../../services/sideEffects';
import { getDoseLogsRange, type DoseLogEntry } from '../../services/schedule';
import { fetchEffects, type SupplementEffectAvg } from '../../services/trends';
import { findInteractions, type FoundInteraction } from '../../utils/interactions';
import { computeOptimalBlock } from '../../utils/timingOptimiser';
import { SideEffectSheet } from './SideEffectSheet';
import { EffectsSection } from './EffectsSection';
import { getEffectRatings, type EffectRating } from '../../utils/effectsStorage';

const RATING_LABELS: Record<number, string> = {
  1: 'Mild', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Severe',
};

interface Props {
  visible: boolean;
  item: CabinetItem | null;
  token: string;
  onClose: () => void;
  onUpdated: (item: CabinetItem) => void;
  onStockChange?: (id: string, delta: number) => void;
  currentStock?: number;
  otherItemNames?: string[];
}

interface EditDraft {
  dosage: string;
  timing: string;
  frequency: string;
  notes: string;
  purpose: string;
}

export function SupplementDetailSheet({
  visible,
  item,
  token,
  onClose,
  onUpdated,
  onStockChange,
  currentStock,
  otherItemNames = [],
}: Props) {
  const [draft, setDraft] = useState<EditDraft>({ dosage: '', timing: '', frequency: '', notes: '', purpose: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sideEffects, setSideEffects] = useState<SideEffectEntry[]>([]);
  const [sideEffectSheetVisible, setSideEffectSheetVisible] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [doseLogs, setDoseLogs] = useState<DoseLogEntry[]>([]);
  const [doseLogsLoading, setDoseLogsLoading] = useState(false);
  const [effectAvg, setEffectAvg] = useState<SupplementEffectAvg | null>(null);
  const [applyingTiming, setApplyingTiming] = useState(false);
  const [effectRatings, setEffectRatings] = useState<EffectRating[]>([]);
  const seLoadedRef = useRef(false);
  const doseLogsLoadedRef = useRef<string | null>(null);

  // Reset draft when item changes
  useEffect(() => {
    if (!item) return;
    setDraft({
      dosage: item.dosage ?? '',
      timing: item.timing ?? '',
      frequency: item.frequency ?? '',
      notes: item.notes ?? '',
      purpose: item.purpose ?? '',
    });
    setSaveError(null);
    seLoadedRef.current = false;
    doseLogsLoadedRef.current = null;
    setActiveTab('details');
    setDoseLogs([]);
    setEffectAvg(null);
    setEffectRatings([]);
  }, [item?._id]);

  // Load side effects + dose logs + effect ratings when sheet opens
  useEffect(() => {
    if (!visible || !item || item._id.startsWith('mock')) return;

    if (!seLoadedRef.current) {
      seLoadedRef.current = true;
      void getSideEffects(token, item._id, 20)
        .then(setSideEffects)
        .catch(() => {/* non-critical */});
    }

    if (doseLogsLoadedRef.current !== item._id) {
      doseLogsLoadedRef.current = item._id;
      setDoseLogsLoading(true);
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 90 * 86_400_000).toISOString().slice(0, 10);
      void getDoseLogsRange(token, from, to)
        .then((logs) => setDoseLogs(logs.filter((l) => l.supplementId === item._id)))
        .catch(() => setDoseLogs([]))
        .finally(() => setDoseLogsLoading(false));
      void fetchEffects(token, 90)
        .then((avgs) => {
          const match = avgs.find((a) => a.name.toLowerCase() === item.name.toLowerCase());
          setEffectAvg(match ?? null);
        })
        .catch(() => {/* non-critical */});

      // Load local effectiveness ratings
      void getEffectRatings(item._id).then(setEffectRatings).catch(() => {/* non-critical */});
    }
  }, [visible, item, token]);

  const refreshSideEffects = useCallback(() => {
    if (!item || item._id.startsWith('mock')) return;
    void getSideEffects(token, item._id, 20)
      .then(setSideEffects)
      .catch(() => {/* non-critical */});
  }, [token, item]);

  const isDirty =
    item !== null && (
      draft.dosage !== (item.dosage ?? '') ||
      draft.timing !== (item.timing ?? '') ||
      draft.frequency !== (item.frequency ?? '') ||
      draft.notes !== (item.notes ?? '') ||
      draft.purpose !== (item.purpose ?? '')
    );

  const handleSave = async () => {
    if (!item || !isDirty) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateCabinetItem(item._id, {
        dosage: draft.dosage || undefined,
        timing: draft.timing || undefined,
        frequency: draft.frequency || undefined,
        notes: draft.notes || undefined,
        purpose: draft.purpose || undefined,
      }, token);
      onUpdated(updated);
    } catch {
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePause = async (days: number) => {
    if (!item) return;
    setPauseLoading(true);
    setPauseError(null);
    try {
      await pauseCabinetItem(item._id, days, token);
      const pausedUntil = new Date(Date.now() + days * 86_400_000).toISOString();
      onUpdated({ ...item, isPaused: true, pausedUntil });
    } catch {
      setPauseError('Could not pause. Please try again.');
    } finally {
      setPauseLoading(false);
    }
  };

  const handleUnpause = async () => {
    if (!item) return;
    setPauseLoading(true);
    setPauseError(null);
    try {
      await unpauseCabinetItem(item._id, token);
      onUpdated({ ...item, isPaused: false, pausedUntil: undefined });
    } catch {
      setPauseError('Could not resume. Please try again.');
    } finally {
      setPauseLoading(false);
    }
  };

  const handleApplyTiming = async (slotLabel: string) => {
    if (!item) return;
    setApplyingTiming(true);
    try {
      const updated = await updateCabinetItem(item._id, { timing: slotLabel }, token);
      onUpdated(updated);
      setDraft((d) => ({ ...d, timing: slotLabel }));
    } catch {
      // non-critical — timing update failed silently
    } finally {
      setApplyingTiming(false);
    }
  };

  if (!item) return null;

  const interactions: FoundInteraction[] = findInteractions(item.name, otherItemNames);
  const stockLabel = currentStock !== undefined ? `${currentStock}d` : '—';
  const optimalBlock = computeOptimalBlock(doseLogs, effectAvg);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Close details"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{item.name}</Text>
            {isDirty ? (
              <Pressable
                onPress={() => { void handleSave(); }}
                disabled={saving}
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
                accessibilityRole="button"
                accessibilityLabel="Save changes"
              >
                {saving
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Text style={styles.saveBtnText}>Save</Text>}
              </Pressable>
            ) : (
              <View style={styles.saveBtn} />
            )}
          </View>

          {/* Tab toggle */}
          <View style={styles.tabRow}>
            {(['details', 'history'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'history' ? (
              <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dose History (last 30 days)</Text>
                {doseLogsLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
                ) : doseLogs.length === 0 ? (
                  <Text style={styles.emptyHistory}>No doses logged yet. Start logging from the Home screen.</Text>
                ) : (
                  doseLogs.slice().sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()).map((log) => {
                    const d = new Date(log.takenAt);
                    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <View key={log._id} style={styles.doseLogRow}>
                        <Text style={styles.doseLogTick}>✓</Text>
                        <View style={styles.doseLogInfo}>
                          <Text style={styles.doseLogDate}>{dateStr}</Text>
                          <Text style={styles.doseLogTime}>{timeStr}{log.late ? ' · Late' : ''}</Text>
                        </View>
                        <Text style={styles.doseLogSlot}>{log.slot.charAt(0).toUpperCase() + log.slot.slice(1)}</Text>
                      </View>
                    );
                  })
                )}
              </View>

              {/* ── Effects timeline ───────────────────────── */}
              {item && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Effects Timeline</Text>
                  <EffectsSection supplementId={item._id} ratings={effectRatings} />
                </View>
              )}
              </>
            ) : (
            <>
            {/* ── Fields ──────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <DetailField
                label="Dosage"
                value={draft.dosage}
                placeholder="e.g. 2000 IU"
                onChangeText={(t) => setDraft((d) => ({ ...d, dosage: t }))}
              />
              <DetailField
                label="Frequency"
                value={draft.frequency}
                placeholder="e.g. Daily"
                onChangeText={(t) => setDraft((d) => ({ ...d, frequency: t }))}
              />
              <DetailField
                label="Timing / slot"
                value={draft.timing}
                placeholder="e.g. Morning with food"
                onChangeText={(t) => setDraft((d) => ({ ...d, timing: t }))}
              />
              <DetailField
                label="Notes"
                value={draft.notes}
                placeholder="Personal notes…"
                multiline
                onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))}
              />
              <DetailField
                label="Purpose"
                value={draft.purpose}
                placeholder="e.g. better sleep, immune support"
                onChangeText={(t) => setDraft((d) => ({ ...d, purpose: t }))}
              />
            </View>

            {saveError !== null && (
              <Text style={styles.errorText}>{saveError}</Text>
            )}

            {/* ── Stock ───────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stock</Text>
              <View style={styles.stockRow}>
                <View style={styles.stockValue}>
                  <Text style={styles.stockNumber}>{stockLabel}</Text>
                  <Text style={styles.stockSub}>days remaining</Text>
                </View>
                {onStockChange && (
                  <View style={styles.stockBtns}>
                    <Pressable
                      style={({ pressed }) => [styles.stockBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => onStockChange(item._id, -1)}
                      accessibilityRole="button"
                      accessibilityLabel="Remove 1 day"
                    >
                      <Text style={styles.stockBtnText}>−1d</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.stockBtn, styles.stockBtnAdd, pressed && { opacity: 0.7 }]}
                      onPress={() => onStockChange(item._id, 30)}
                      accessibilityRole="button"
                      accessibilityLabel="Add 30 days"
                    >
                      <Text style={[styles.stockBtnText, { color: colors.primary }]}>+30d</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {/* ── Side Effects ────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Side Effect History</Text>
                <Pressable
                  onPress={() => setSideEffectSheetVisible(true)}
                  style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Log a side effect"
                >
                  <Text style={styles.logBtnText}>+ Log</Text>
                </Pressable>
              </View>

              {sideEffects.length === 0 ? (
                <Text style={styles.emptyText}>No side effects logged yet.</Text>
              ) : (
                sideEffects.map((se) => (
                  <View key={se._id} style={styles.seRow}>
                    <View style={styles.seRating}>
                      <Text style={styles.seRatingText}>{se.rating}</Text>
                    </View>
                    <View style={styles.seInfo}>
                      <Text style={styles.seSymptom}>{se.symptom}</Text>
                      <Text style={styles.seMeta}>
                        {RATING_LABELS[se.rating] ?? 'Unknown'} · {new Date(se.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ── Interactions ────────────────────────────── */}
            {interactions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interactions</Text>
                {interactions.map((ix) => (
                  <View key={ix.withName} style={styles.interactionCard}>
                    <Text style={styles.interactionWith}>⚠️ {ix.withName}</Text>
                    <Text style={styles.interactionMsg}>{ix.message}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── Best time for you ───────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Best time for you</Text>
              {optimalBlock ? (
                <>
                  <Text style={styles.bestTimeDesc}>
                    Based on <Text style={styles.bold}>{optimalBlock.sampleCount}</Text> effect ratings, you typically take{' '}
                    <Text style={styles.bold}>{item.name}</Text> in the{' '}
                    <Text style={styles.bold}>{optimalBlock.slotLabel}</Text> and rate its effects{' '}
                    <Text style={styles.bold}>{optimalBlock.overallScore}/5</Text>.
                  </Text>
                  <Pressable
                    onPress={() => { void handleApplyTiming(optimalBlock.slotLabel); }}
                    disabled={applyingTiming || draft.timing.toLowerCase() === optimalBlock.slotLabel.toLowerCase()}
                    style={({ pressed }) => [
                      styles.applyTimingBtn,
                      (pressed || applyingTiming) && { opacity: 0.7 },
                      draft.timing.toLowerCase() === optimalBlock.slotLabel.toLowerCase() && styles.applyTimingBtnApplied,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Apply ${optimalBlock.slotLabel} timing`}
                  >
                    <Text style={[
                      styles.applyTimingBtnText,
                      draft.timing.toLowerCase() === optimalBlock.slotLabel.toLowerCase() && { color: colors.text2 },
                    ]}>
                      {draft.timing.toLowerCase() === optimalBlock.slotLabel.toLowerCase()
                        ? '✓ Applied'
                        : applyingTiming ? 'Applying…' : `Apply ${optimalBlock.slotLabel} timing`}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.bestTimeEmpty}>
                  {(effectAvg?.count ?? 0) < 7
                    ? `Not enough data yet — log ${Math.max(0, 7 - (effectAvg?.count ?? 0))} more effect rating${Math.max(0, 7 - (effectAvg?.count ?? 0)) !== 1 ? 's' : ''} to see your personalised recommendation.`
                    : 'Not enough data yet — keep logging your effects after each dose.'}
                </Text>
              )}
            </View>

            {/* ── Pause / Holiday Mode ────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Holiday Mode</Text>
              {item.isPaused && item.pausedUntil ? (
                <View style={styles.pausedBanner}>
                  <Text style={styles.pausedBannerText}>
                    Paused until {new Date(item.pausedUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                  <Pressable
                    onPress={() => { void handleUnpause(); }}
                    disabled={pauseLoading}
                    style={({ pressed }) => [styles.resumeBtn, pressed && { opacity: 0.8 }]}
                    accessibilityRole="button"
                    accessibilityLabel="Resume supplement"
                  >
                    <Text style={styles.resumeBtnText}>Resume now</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pauseRow}>
                  {([1, 3, 7, 14] as const).map((days) => (
                    <Pressable
                      key={days}
                      onPress={() => { void handlePause(days); }}
                      disabled={pauseLoading}
                      style={({ pressed }) => [styles.pauseChip, pressed && { opacity: 0.8 }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Pause for ${days} days`}
                    >
                      <Text style={styles.pauseChipText}>{days}d</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {pauseError !== null && <Text style={styles.errorText}>{pauseError}</Text>}
            </View>

            <View style={{ height: spacing.xxxl }} />
            </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <SideEffectSheet
        visible={sideEffectSheetVisible}
        cabinetItemId={item._id}
        supplementName={item.name}
        onClose={() => {
          setSideEffectSheetVisible(false);
          refreshSideEffects();
        }}
      />
    </>
  );
}

function DetailField({
  label,
  value,
  placeholder,
  onChangeText,
  multiline = false,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (t: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text4}
        multiline={multiline}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={`${label} input`}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    ...typography.caption,
    color: colors.text2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    minHeight: 40,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
  },
  closeBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  closeBtnText: { fontSize: 16, color: colors.text3, fontWeight: '600' },
  saveBtn: {
    width: 48,
    alignItems: 'flex-end',
  },
  saveBtnText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.xl,
  },
  section: {
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pauseRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pauseChip: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.info,
  },
  pauseChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
  },
  pausedBanner: {
    backgroundColor: colors.infoLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pausedBannerText: {
    fontSize: 13,
    color: colors.info,
    fontWeight: '500',
  },
  resumeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.info,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resumeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockValue: { gap: 2 },
  stockNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 34,
  },
  stockSub: { ...typography.caption, color: colors.text3 },
  stockBtns: { flexDirection: 'row', gap: spacing.sm },
  stockBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stockBtnAdd: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight,
  },
  stockBtnText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text2,
  },
  logBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight,
  },
  logBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  emptyText: { ...typography.bodySmall, color: colors.text3, fontStyle: 'italic' },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPad,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '40',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
  tabBtnTextActive: {
    color: colors.primary,
  },
  emptyHistory: {
    ...typography.bodySmall,
    color: colors.text3,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
  doseLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  doseLogTick: {
    fontSize: 16,
    color: colors.ok ?? '#2d9d5a',
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  doseLogInfo: { flex: 1 },
  doseLogDate: { ...typography.bodySmall, fontWeight: '600', color: colors.text },
  doseLogTime: { ...typography.caption, color: colors.text3, marginTop: 1 },
  doseLogSlot: { ...typography.caption, color: colors.text3 },
  seRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  seRating: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  seRatingText: { fontSize: 13, fontWeight: '700', color: colors.warning },
  seInfo: { flex: 1 },
  seSymptom: { ...typography.bodySmall, fontWeight: '600', color: colors.text },
  seMeta: { ...typography.caption, color: colors.text3, marginTop: 2 },
  interactionCard: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning + '50',
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  interactionWith: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.warning,
  },
  interactionMsg: {
    ...typography.caption,
    color: colors.text2,
    lineHeight: 16,
  },
  bestTimeDesc: {
    ...typography.bodySmall,
    color: colors.text2,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bestTimeEmpty: {
    ...typography.bodySmall,
    color: colors.text3,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  applyTimingBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
  },
  applyTimingBtnApplied: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  applyTimingBtnText: {
    ...typography.bodySmall,
    color: colors.surface,
    fontWeight: '700',
  },
});
