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
import { updateCabinetItem, type CabinetItem } from '../../services/cabinet';
import { getSideEffects, type SideEffectEntry } from '../../services/sideEffects';
import { SideEffectSheet } from './SideEffectSheet';

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
}

interface EditDraft {
  dosage: string;
  timing: string;
  frequency: string;
  notes: string;
}

export function SupplementDetailSheet({
  visible,
  item,
  token,
  onClose,
  onUpdated,
  onStockChange,
  currentStock,
}: Props) {
  const [draft, setDraft] = useState<EditDraft>({ dosage: '', timing: '', frequency: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sideEffects, setSideEffects] = useState<SideEffectEntry[]>([]);
  const [sideEffectSheetVisible, setSideEffectSheetVisible] = useState(false);
  const seLoadedRef = useRef(false);

  // Reset draft when item changes
  useEffect(() => {
    if (!item) return;
    setDraft({
      dosage: item.dosage ?? '',
      timing: item.timing ?? '',
      frequency: item.frequency ?? '',
      notes: item.notes ?? '',
    });
    setSaveError(null);
    seLoadedRef.current = false;
  }, [item?._id]);

  // Load side effects when sheet opens
  useEffect(() => {
    if (!visible || !item || seLoadedRef.current || item._id.startsWith('mock')) return;
    seLoadedRef.current = true;
    void getSideEffects(token, item._id, 20)
      .then(setSideEffects)
      .catch(() => {/* non-critical */});
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
      draft.notes !== (item.notes ?? '')
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
      }, token);
      onUpdated(updated);
    } catch {
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  const stockLabel = currentStock !== undefined ? `${currentStock}d` : '—';

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

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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

            <View style={{ height: spacing.xxxl }} />
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
});
