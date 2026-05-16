/**
 * Health Profile screen — issue #21
 *
 * Layout:
 *   - CompletenessBar (sticky top)
 *   - ScrollView
 *     - Body accordion (+ WeightLogChart)
 *     - Conditions accordion
 *     - Lifestyle accordion
 *     - Goals accordion
 */

import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AccordionSection from '../../components/profile/AccordionSection';
import CompletenessBar from '../../components/profile/CompletenessBar';
import ProfileField from '../../components/profile/ProfileField';
import WeightLogChart from '../../components/profile/WeightLogChart';
import {
  computeCompleteness,
  emptyProfile,
  fetchProfile,
  fetchWeightLog,
  type BodySection,
  type ConditionsSection,
  type GoalsSection,
  type HealthProfile,
  type LifestyleSection,
  type Provenance,
  type WeightEntry,
  updateProfile,
} from '../../services/profile';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── State ────────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'success' | 'error';

type SectionKey = 'body' | 'conditions' | 'lifestyle' | 'goals';

interface State {
  profile: HealthProfile;
  weightLog: WeightEntry[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  drafts: {
    body: Partial<Record<keyof BodySection, string>>;
    conditions: Partial<Record<keyof ConditionsSection, string>>;
    lifestyle: Partial<Record<keyof LifestyleSection, string>>;
    goals: Partial<Record<keyof GoalsSection, string>>;
  };
  saveState: Record<SectionKey, SaveState>;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; profile: HealthProfile; weightLog: WeightEntry[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'REFRESH_START' }
  | { type: 'REFRESH_DONE' }
  | {
      type: 'DRAFT_CHANGE';
      section: SectionKey;
      field: string;
      value: string;
    }
  | { type: 'SAVE_START'; section: SectionKey }
  | { type: 'SAVE_SUCCESS'; section: SectionKey; profile: HealthProfile }
  | { type: 'SAVE_ERROR'; section: SectionKey }
  | { type: 'RESET_SAVE_STATE'; section: SectionKey };

function initialState(): State {
  return {
    profile: emptyProfile(),
    weightLog: [],
    loading: true,
    refreshing: false,
    error: null,
    drafts: { body: {}, conditions: {}, lifestyle: {}, goals: {} },
    saveState: {
      body: 'idle',
      conditions: 'idle',
      lifestyle: 'idle',
      goals: 'idle',
    },
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        loading: false,
        refreshing: false,
        profile: action.profile,
        weightLog: action.weightLog,
        drafts: { body: {}, conditions: {}, lifestyle: {}, goals: {} },
      };
    case 'LOAD_ERROR':
      return { ...state, loading: false, refreshing: false, error: action.error };
    case 'REFRESH_START':
      return { ...state, refreshing: true, error: null };
    case 'REFRESH_DONE':
      return { ...state, refreshing: false };
    case 'DRAFT_CHANGE':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.section]: {
            ...state.drafts[action.section],
            [action.field]: action.value,
          },
        },
      };
    case 'SAVE_START':
      return {
        ...state,
        saveState: { ...state.saveState, [action.section]: 'saving' },
      };
    case 'SAVE_SUCCESS':
      return {
        ...state,
        profile: action.profile,
        drafts: { ...state.drafts, [action.section]: {} },
        saveState: { ...state.saveState, [action.section]: 'success' },
      };
    case 'SAVE_ERROR':
      return {
        ...state,
        saveState: { ...state.saveState, [action.section]: 'error' },
      };
    case 'RESET_SAVE_STATE':
      return {
        ...state,
        saveState: { ...state.saveState, [action.section]: 'idle' },
      };
    default:
      return state;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive the section-level provenance badge from the worst field state.
 * Priority: needs_review > ai_extracted > user_edited.
 */
function sectionProvenance(section: unknown): Provenance {
  const values = Object.values(
    section as Record<string, { provenance: Provenance }>,
  );
  if (values.some((f) => f.provenance === 'needs_review')) return 'needs_review';
  if (values.some((f) => f.provenance === 'ai_extracted')) return 'ai_extracted';
  return 'user_edited';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  // Auto-reset success feedback after 2s
  const successTimers = useRef<Record<SectionKey, ReturnType<typeof setTimeout> | null>>({
    body: null,
    conditions: null,
    lifestyle: null,
    goals: null,
  });

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      dispatch({ type: isRefresh ? 'REFRESH_START' : 'LOAD_START' });
      try {
        const [profile, weightLog] = await Promise.all([
          fetchProfile(token),
          fetchWeightLog(token, 30),
        ]);
        dispatch({ type: 'LOAD_SUCCESS', profile, weightLog });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load profile';
        dispatch({ type: 'LOAD_ERROR', error: message });
      }
    },
    [token],
  );

  useEffect(() => {
    void load(false);
    return () => {
      // Clear any lingering timers on unmount
      Object.values(successTimers.current).forEach((t) => {
        if (t) clearTimeout(t);
      });
    };
  }, [load]);

  const handleSave = useCallback(
    async (section: SectionKey) => {
      if (!token) return;

      const draft = state.drafts[section];
      if (Object.keys(draft).length === 0) return;

      dispatch({ type: 'SAVE_START', section });

      try {
        // Build partial update — wrap each draft field into { value, provenance }
        const sectionData = Object.fromEntries(
          Object.entries(draft).map(([field, value]) => [
            field,
            { value, provenance: 'user_edited' as Provenance },
          ]),
        );

        const updated = await updateProfile(token, {
          [section]: sectionData,
        } as Partial<HealthProfile>);

        dispatch({ type: 'SAVE_SUCCESS', section, profile: updated });

        // Auto-reset success → idle after 2s
        if (successTimers.current[section]) {
          clearTimeout(successTimers.current[section]!);
        }
        successTimers.current[section] = setTimeout(() => {
          dispatch({ type: 'RESET_SAVE_STATE', section });
        }, 2000);
      } catch (err) {
        dispatch({ type: 'SAVE_ERROR', section });
        const message = err instanceof Error ? err.message : 'Save failed';
        Alert.alert('Save failed', message);
      }
    },
    [token, state.drafts],
  );

  const draftChange = useCallback(
    (section: SectionKey, field: string, value: string) => {
      dispatch({ type: 'DRAFT_CHANGE', section, field, value });
    },
    [],
  );

  // ─── Render states ──────────────────────────────────────────────────────────

  if (state.loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.error && !state.refreshing) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{state.error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
            onPress={() => void load(false)}
            accessibilityRole="button"
            accessibilityLabel="Retry loading profile"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { profile, weightLog, saveState } = state;
  const completeness = computeCompleteness(profile);

  // Helper: current field value (draft overrides profile)
  function fieldVal<S extends SectionKey>(
    section: S,
    field: string,
  ): string {
    const draft = state.drafts[section] as Record<string, string | undefined>;
    if (draft[field] !== undefined) return draft[field]!;
    const sec = (profile[section] as unknown) as Record<string, { value: unknown }>;
    const v = sec[field]?.value;
    return v !== null && v !== undefined ? String(v) : '';
  }

  function fieldProv<S extends SectionKey>(
    section: S,
    field: string,
  ): Provenance {
    // If there's an unsaved draft, mark as user_edited
    const draft = state.drafts[section] as Record<string, string | undefined>;
    if (draft[field] !== undefined && draft[field] !== '') return 'user_edited';
    const sec = (profile[section] as unknown) as Record<string, { provenance: Provenance }>;
    return sec[field]?.provenance ?? 'needs_review';
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Completeness bar sits below the native header */}
      <CompletenessBar percent={completeness} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={() => void load(true)}
            tintColor={colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Body ─────────────────────────────────────────────── */}
        <AccordionSection
          title="Body"
          provenance={sectionProvenance(profile.body)}
          defaultOpen
          saveState={saveState.body}
          onSave={() => void handleSave('body')}
        >
          <ProfileField
            label="Age"
            value={profile.body.age.value}
            provenance={fieldProv('body', 'age')}
            keyboardType="numeric"
            unit="years"
            onChangeText={(t) => draftChange('body', 'age', t)}
            editable
          />
          <ProfileField
            label="Sex"
            value={profile.body.sex.value}
            provenance={fieldProv('body', 'sex')}
            onChangeText={(t) => draftChange('body', 'sex', t)}
            editable
          />
          <ProfileField
            label="Height"
            value={fieldVal('body', 'height_cm')}
            provenance={fieldProv('body', 'height_cm')}
            keyboardType="numeric"
            unit="cm"
            onChangeText={(t) => draftChange('body', 'height_cm', t)}
            editable
          />
          <ProfileField
            label="Weight"
            value={fieldVal('body', 'weight_kg')}
            provenance={fieldProv('body', 'weight_kg')}
            keyboardType="numeric"
            unit="kg"
            onChangeText={(t) => draftChange('body', 'weight_kg', t)}
            editable
          />
          <ProfileField
            label="BMI"
            value={profile.body.bmi.value}
            provenance={profile.body.bmi.provenance}
          />

          {/* Weight trend chart */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Weight trend (last 30 entries)</Text>
            <WeightLogChart entries={weightLog} />
          </View>
        </AccordionSection>

        {/* ── Conditions ───────────────────────────────────────── */}
        <AccordionSection
          title="Conditions"
          provenance={sectionProvenance(profile.conditions)}
          saveState={saveState.conditions}
          onSave={() => void handleSave('conditions')}
        >
          <ProfileField
            label="Medical conditions"
            value={fieldVal('conditions', 'conditions')}
            provenance={fieldProv('conditions', 'conditions')}
            multiline
            onChangeText={(t) => draftChange('conditions', 'conditions', t)}
            editable
          />
          <ProfileField
            label="Allergies"
            value={fieldVal('conditions', 'allergies')}
            provenance={fieldProv('conditions', 'allergies')}
            multiline
            onChangeText={(t) => draftChange('conditions', 'allergies', t)}
            editable
          />
          <ProfileField
            label="Current medications"
            value={fieldVal('conditions', 'medications')}
            provenance={fieldProv('conditions', 'medications')}
            multiline
            onChangeText={(t) => draftChange('conditions', 'medications', t)}
            editable
          />
        </AccordionSection>

        {/* ── Lifestyle ────────────────────────────────────────── */}
        <AccordionSection
          title="Lifestyle"
          provenance={sectionProvenance(profile.lifestyle)}
          saveState={saveState.lifestyle}
          onSave={() => void handleSave('lifestyle')}
        >
          <ProfileField
            label="Diet"
            value={fieldVal('lifestyle', 'diet')}
            provenance={fieldProv('lifestyle', 'diet')}
            onChangeText={(t) => draftChange('lifestyle', 'diet', t)}
            editable
          />
          <ProfileField
            label="Activity level"
            value={fieldVal('lifestyle', 'activity_level')}
            provenance={fieldProv('lifestyle', 'activity_level')}
            onChangeText={(t) => draftChange('lifestyle', 'activity_level', t)}
            editable
          />
          <ProfileField
            label="Sleep"
            value={fieldVal('lifestyle', 'sleep_hours')}
            provenance={fieldProv('lifestyle', 'sleep_hours')}
            keyboardType="numeric"
            unit="hrs/night"
            onChangeText={(t) => draftChange('lifestyle', 'sleep_hours', t)}
            editable
          />
          <ProfileField
            label="Alcohol"
            value={fieldVal('lifestyle', 'alcohol')}
            provenance={fieldProv('lifestyle', 'alcohol')}
            onChangeText={(t) => draftChange('lifestyle', 'alcohol', t)}
            editable
          />
          <ProfileField
            label="Smoking"
            value={fieldVal('lifestyle', 'smoking')}
            provenance={fieldProv('lifestyle', 'smoking')}
            onChangeText={(t) => draftChange('lifestyle', 'smoking', t)}
            editable
          />
        </AccordionSection>

        {/* ── Goals ────────────────────────────────────────────── */}
        <AccordionSection
          title="Goals"
          provenance={sectionProvenance(profile.goals)}
          saveState={saveState.goals}
          onSave={() => void handleSave('goals')}
        >
          <ProfileField
            label="Primary goal"
            value={fieldVal('goals', 'primary_goal')}
            provenance={fieldProv('goals', 'primary_goal')}
            multiline
            onChangeText={(t) => draftChange('goals', 'primary_goal', t)}
            editable
          />
          <ProfileField
            label="Secondary goals"
            value={fieldVal('goals', 'secondary_goals')}
            provenance={fieldProv('goals', 'secondary_goals')}
            multiline
            onChangeText={(t) => draftChange('goals', 'secondary_goals', t)}
            editable
          />
          <ProfileField
            label="Concerns"
            value={fieldVal('goals', 'concerns')}
            provenance={fieldProv('goals', 'concerns')}
            multiline
            onChangeText={(t) => draftChange('goals', 'concerns', t)}
            editable
          />
        </AccordionSection>

        {/* History link */}
        <Pressable
          onPress={() => router.push('/(tabs)/history' as Parameters<typeof router.push>[0])}
          style={({ pressed }) => [styles.historyLink, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="View history"
        >
          <Text style={styles.historyLinkText}>View History →</Text>
        </Pressable>

        {/* Sign out */}
        <Pressable
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login' as Parameters<typeof router.replace>[0]);
          }}
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPad,
    paddingTop: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    color: colors.text2,
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  retryText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  historyLink: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  historyLinkText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  signOutBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerMid,
    alignItems: 'center',
  },
  signOutText: {
    ...typography.bodyStrong,
    color: colors.danger,
    fontSize: 15,
  },
  chartContainer: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  chartTitle: {
    ...typography.bodySmall,
    color: colors.text2,
    fontWeight: '600',
  },
});
