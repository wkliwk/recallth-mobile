/**
 * Step 2: Cabinet seed — up to 3 quick-add supplements.
 * Includes pre-defined chip suggestions + a free-text input.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingStore } from '../../stores/onboarding';
import { colors, radius, spacing, typography } from '../../utils/theme';

const MAX_ITEMS = 3;

/** AI-assist stub: popular supplements shown as quick-add chips. */
const SUGGESTIONS = [
  'Vitamin D3',
  'Magnesium',
  'Omega-3',
  'Zinc',
  'Vitamin C',
  'B12',
  'Ashwagandha',
  'Creatine',
  'Iron',
  'Melatonin',
];

export default function Step2Screen() {
  const router = useRouter();
  const { cabinetItems, setCabinetItems } = useOnboardingStore((s) => ({
    cabinetItems: s.cabinetItems,
    setCabinetItems: s.setCabinetItems,
  }));

  const [customInput, setCustomInput] = useState('');

  const addItem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (cabinetItems.includes(trimmed)) return;
    if (cabinetItems.length >= MAX_ITEMS) return;
    setCabinetItems([...cabinetItems, trimmed]);
  };

  const removeItem = (name: string) => {
    setCabinetItems(cabinetItems.filter((i) => i !== name));
  };

  const onAddCustom = () => {
    addItem(customInput);
    setCustomInput('');
  };

  const onNext = () => {
    router.push('/(onboarding)/step3');
  };

  const onSkip = () => {
    setCabinetItems([]);
    router.push('/(onboarding)/step3');
  };

  const spotsLeft = MAX_ITEMS - cabinetItems.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress + skip */}
          <View style={styles.topRow}>
            <StepIndicator current={2} total={3} />
            <Pressable
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip cabinet step"
            >
              <Text style={styles.skip}>Skip for now</Text>
            </Pressable>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>What are you taking?</Text>
            <Text style={styles.subtitle}>
              Add up to 3 supplements from your cabinet. You can edit this any
              time.
            </Text>
          </View>

          {/* Selected items */}
          {cabinetItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Selected ({cabinetItems.length}/{MAX_ITEMS})</Text>
              <View style={styles.chips}>
                {cabinetItems.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.chipSelected}
                    onPress={() => removeItem(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item}`}
                  >
                    <Text style={styles.chipTextSelected}>{item}</Text>
                    <Text style={styles.chipRemove}>  ✕</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Suggestions */}
          {spotsLeft > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Quick add</Text>
              <View style={styles.chips}>
                {SUGGESTIONS.filter((s) => !cabinetItems.includes(s)).map(
                  (s) => (
                    <Pressable
                      key={s}
                      style={styles.chip}
                      onPress={() => addItem(s)}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${s}`}
                    >
                      <Text style={styles.chipText}>{s}</Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>
          )}

          {/* Custom input */}
          {spotsLeft > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Or type your own</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={customInput}
                  onChangeText={setCustomInput}
                  placeholder="e.g. CoQ10"
                  placeholderTextColor={colors.text3}
                  returnKeyType="done"
                  onSubmitEditing={onAddCustom}
                  accessibilityLabel="Custom supplement name"
                />
                <Pressable
                  style={[
                    styles.addBtn,
                    !customInput.trim() && styles.addBtnDisabled,
                  ]}
                  onPress={onAddCustom}
                  disabled={!customInput.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Add supplement"
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          )}

          {spotsLeft === 0 && (
            <View style={styles.limitBanner}>
              <Text style={styles.limitText}>
                Cabinet full (3/3). Remove one to add another.
              </Text>
            </View>
          )}

          {/* Next */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cta,
                pressed && styles.ctaPressed,
              ]}
              onPress={onNext}
              accessibilityRole="button"
              accessibilityLabel="Continue to step 3"
            >
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <View style={indicatorStyles.row} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            indicatorStyles.dot,
            i + 1 === current && indicatorStyles.dotActive,
            i + 1 < current && indicatorStyles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.text4,
  },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  dotDone: { backgroundColor: colors.primaryMid },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  skip: { ...typography.body, color: colors.text2 },
  header: { marginBottom: spacing.xxl },
  title: { ...typography.pageTitle, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.text2 },
  section: { marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.caption,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { ...typography.bodySmall, color: colors.text2 },
  chipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipTextSelected: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  chipRemove: { ...typography.bodySmall, color: colors.primary },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    minHeight: 48,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { ...typography.bodyStrong, color: colors.surface },
  limitBanner: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryMid,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  limitText: { ...typography.bodySmall, color: colors.primary },
  actions: { marginTop: spacing.sm },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { ...typography.cta, color: colors.surface },
});
