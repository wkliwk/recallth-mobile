/**
 * AddSheet — bottom-sheet modal for adding or editing a supplement.
 *
 * Uses a native Modal + ScrollView (no external sheet library dependency).
 * Pre-populated when editing (item prop provided).
 *
 * Fields: name (AI suggestion stub), type, dose, frequency, timing, status.
 *
 * Design: primary CTA button (green gradient), secondary Cancel.
 * Uses KeyboardAvoidingView so inputs don't get hidden by the keyboard.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { AiSuggestion, CabinetItem, CreateCabinetItemInput, SupplementStatus, SupplementType, aiLookupSupplement, deriveStatus, statusToFields } from '../../services/cabinet';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { BarcodeScannerSheet } from './BarcodeScannerSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (input: CreateCabinetItemInput) => Promise<void>;
  item?: CabinetItem | null;
};

type TypeOption = { value: SupplementType; label: string; icon: string };
type StatusOption = { value: SupplementStatus; label: string };

const TYPE_OPTIONS: TypeOption[] = [
  { value: 'supplement', label: 'Supplement', icon: '🌿' },
  { value: 'vitamin', label: 'Vitamin', icon: '☀' },
  { value: 'medication', label: 'Medication', icon: '💊' },
];

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'stopped', label: 'Stopped' },
];

const AI_SUGGESTIONS = [
  'Vitamin D3', 'Omega-3', 'Magnesium Glycinate', 'Zinc', 'Vitamin B12',
  'Ashwagandha', 'Probiotics', 'Collagen', 'CoQ10', 'Iron', 'Creatine',
];

function getRandomSuggestions(count: number): string[] {
  const shuffled = [...AI_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function AddSheet({ visible, onClose, onSave, item }: Props) {
  const isEdit = Boolean(item);
  const token = useAuthStore((s) => s.token);

  const [name, setName] = useState('');
  const [type, setType] = useState<SupplementType>('supplement');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [timing, setTiming] = useState('');
  const [status, setStatus] = useState<SupplementStatus>('active');
  const [saving, setSaving] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [localSuggestions] = useState<string[]>(() => getRandomSuggestions(3));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const nameInputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Populate form when editing.
  useEffect(() => {
    if (visible) {
      if (item) {
        setName(item.name);
        setType(item.type);
        setDosage(item.dosage ?? '');
        setFrequency(item.frequency ?? '');
        setTiming(item.timing ?? '');
        setStatus(deriveStatus(item));
      } else {
        setName('');
        setType('supplement');
        setDosage('');
        setFrequency('');
        setTiming('');
        setStatus('active');
      }
      setShowSuggestions(false);

      // Slide in.
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, item, slideAnim]);

  const handleClose = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: 300,
      useNativeDriver: true,
      speed: 30,
    }).start(() => {
      onClose();
    });
  }, [onClose, slideAnim]);

  const handleSave = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Please enter a supplement name.');
      nameInputRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const statusFields = statusToFields(status);
      const input: CreateCabinetItemInput = {
        name: trimmedName,
        type,
        dosage: dosage.trim() || undefined,
        frequency: frequency.trim() || undefined,
        timing: timing.trim() || undefined,
        active: statusFields.active,
        endDate: statusFields.endDate ?? undefined,
        source: 'user_input',
      };
      await onSave(input);
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }, [name, type, dosage, frequency, timing, status, onSave, handleClose]);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);

    const q = text.trim();
    if (q.length < 3) {
      setShowSuggestions(q.length === 0 && !isEdit);
      setAiSuggestions([]);
      setLookingUp(false);
      return;
    }

    setShowSuggestions(true);
    if (!token) return;

    setLookingUp(true);
    lookupTimer.current = setTimeout(() => {
      void aiLookupSupplement(q, token).then((results) => {
        setAiSuggestions(results);
        setLookingUp(false);
      }).catch(() => {
        setLookingUp(false);
      });
    }, 500);
  }, [isEdit, token]);

  const handleNameFocus = useCallback(() => {
    if (!isEdit && name.trim() === '') {
      setShowSuggestions(true);
    }
  }, [isEdit, name]);

  const handleNameBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const applyAiSuggestion = useCallback((s: AiSuggestion) => {
    setName(s.name);
    if (s.type) setType(s.type);
    if (s.dosage) setDosage(s.dosage);
    if (s.frequency) setFrequency(s.frequency);
    if (s.timing) setTiming(s.timing);
    setShowSuggestions(false);
    setAiSuggestions([]);
  }, []);

  const applyLocalSuggestion = useCallback((suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEdit ? 'Edit Supplement' : 'Add Supplement'}
            </Text>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyContent}
          >
            {/* Name input */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Name <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.nameRow}>
                <TextInput
                  ref={nameInputRef}
                  style={[styles.input, styles.nameInput]}
                  placeholder="e.g. Vitamin D3, Omega-3, Magnesium"
                  placeholderTextColor={colors.text3}
                  value={name}
                  onChangeText={handleNameChange}
                  onFocus={handleNameFocus}
                  onBlur={handleNameBlur}
                  autoCapitalize="words"
                  returnKeyType="next"
                  maxLength={100}
                  testID="input-name"
                />
                <Pressable
                  onPress={() => setScannerOpen(true)}
                  style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Scan barcode"
                >
                  <Text style={styles.scanBtnIcon}>⌗</Text>
                </Pressable>
              </View>

              {showSuggestions && (
                <View style={styles.suggestions}>
                  {lookingUp ? (
                    <View style={styles.lookupRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.suggestionLabel}>Searching supplements…</Text>
                    </View>
                  ) : aiSuggestions.length > 0 ? (
                    <>
                      <Text style={styles.suggestionLabel}>AI suggestions</Text>
                      {aiSuggestions.map((s) => (
                        <Pressable
                          key={s.name}
                          onPress={() => applyAiSuggestion(s)}
                          style={({ pressed }) => [styles.aiChip, pressed && styles.chipPressed]}
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${s.name}`}
                        >
                          <Text style={styles.aiChipName}>{s.name}{s.brand ? ` · ${s.brand}` : ''}</Text>
                          {s.dosage && <Text style={styles.aiChipDetail}>{s.dosage}{s.frequency ? ` · ${s.frequency}` : ''}</Text>}
                        </Pressable>
                      ))}
                    </>
                  ) : (
                    <>
                      <Text style={styles.suggestionLabel}>Quick add</Text>
                      <View style={styles.chips}>
                        {localSuggestions.map((s) => (
                          <Pressable
                            key={s}
                            onPress={() => applyLocalSuggestion(s)}
                            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`Suggest ${s}`}
                          >
                            <Text style={styles.chipText}>{s}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>

            {/* Type selector */}
            <View style={styles.field}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    style={[styles.typeChip, type === opt.value && styles.typeChipSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: type === opt.value }}
                    accessibilityLabel={opt.label}
                  >
                    <Text style={styles.typeIcon}>{opt.icon}</Text>
                    <Text style={[styles.typeLabel, type === opt.value && styles.typeLabelSelected]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Dose */}
            <View style={styles.field}>
              <Text style={styles.label}>Dose</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1000mg, 2 capsules"
                placeholderTextColor={colors.text3}
                value={dosage}
                onChangeText={setDosage}
                maxLength={100}
                testID="input-dose"
              />
            </View>

            {/* Frequency */}
            <View style={styles.field}>
              <Text style={styles.label}>Frequency</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Once daily, Twice daily"
                placeholderTextColor={colors.text3}
                value={frequency}
                onChangeText={setFrequency}
                maxLength={100}
                testID="input-frequency"
              />
            </View>

            {/* Timing */}
            <View style={styles.field}>
              <Text style={styles.label}>Timing</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. With breakfast, Before bed"
                placeholderTextColor={colors.text3}
                value={timing}
                onChangeText={setTiming}
                maxLength={100}
                testID="input-timing"
              />
            </View>

            {/* Status selector */}
            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setStatus(opt.value)}
                    style={[styles.statusChip, status === opt.value && styles.statusChipSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: status === opt.value }}
                    accessibilityLabel={opt.label}
                  >
                    <Text
                      style={[
                        styles.statusChipLabel,
                        status === opt.value && styles.statusChipLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Save button */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveButton,
                (pressed || saving) && styles.saveButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isEdit ? 'Save changes' : 'Add supplement'}
              testID="button-save"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{isEdit ? 'Save Changes' : 'Add Supplement'}</Text>
              )}
            </Pressable>

            {/* Cancel */}
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      <BarcodeScannerSheet
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onResult={(product) => {
          setName(product.name);
          if (product.dosage) setDosage(product.dosage);
          setScannerOpen(false);
          setShowSuggestions(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.text4,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.text3,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text2,
    fontWeight: '600',
  },
  required: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
    minHeight: 48,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
  },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnIcon: {
    fontSize: 22,
    color: colors.text2,
  },
  suggestions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  suggestionLabel: {
    ...typography.caption,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.aiLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.aiMid,
  },
  chipPressed: {
    opacity: 0.75,
  },
  chipText: {
    ...typography.bodySmall,
    color: colors.ai,
  },
  lookupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiChip: {
    backgroundColor: colors.aiLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.aiMid,
  },
  aiChipName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  aiChipDetail: {
    ...typography.caption,
    color: colors.text3,
    marginTop: 2,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  typeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeIcon: {
    fontSize: 20,
  },
  typeLabel: {
    ...typography.caption,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  typeLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  statusChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  statusChipLabel: {
    ...typography.bodySmall,
    color: colors.text3,
    fontWeight: '600',
  },
  statusChipLabelSelected: {
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    ...typography.cta,
    color: '#FFFFFF',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text3,
  },
});
