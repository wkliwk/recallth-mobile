import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  listExtractions,
  reviewExtraction,
  type ExtractionReviewItem,
} from '../../services/extractionReview';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

const SOURCE_LABELS: Record<string, string> = {
  chat: 'AI Chat',
  onboarding: 'Onboarding',
  manual: 'Manual',
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}

function humanFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\s/, '')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

interface CardProps {
  item: ExtractionReviewItem;
  onAction: (id: string, action: 'confirm' | 'correct' | 'reject', correctedValue?: string) => Promise<void>;
}

function ExtractionCard({ item, onAction }: CardProps) {
  const [correcting, setCorrecting] = useState(false);
  const [correctedText, setCorrectedText] = useState(formatValue(item.extractedValue));
  const [busy, setBusy] = useState(false);

  const handleAction = async (action: 'confirm' | 'correct' | 'reject') => {
    setBusy(true);
    await onAction(item._id, action, action === 'correct' ? correctedText : undefined);
    setBusy(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.fieldName}>{humanFieldName(item.field)}</Text>
        <View style={styles.sourcePill}>
          <Text style={styles.sourceText}>{SOURCE_LABELS[item.source] ?? item.source}</Text>
        </View>
      </View>

      {correcting ? (
        <TextInput
          style={styles.correctionInput}
          value={correctedText}
          onChangeText={setCorrectedText}
          autoFocus
          multiline
          placeholderTextColor={colors.text4}
        />
      ) : (
        <Text style={styles.extractedValue}>{formatValue(item.extractedValue)}</Text>
      )}

      <Text style={styles.extractedAt}>
        Extracted {new Date(item.extractedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Text>

      <View style={styles.actions}>
        {correcting ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && { opacity: 0.7 }]}
              onPress={() => setCorrecting(false)}
              disabled={busy}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnConfirm, pressed && { opacity: 0.8 }, busy && styles.btnDisabled]}
              onPress={() => { void handleAction('correct'); }}
              disabled={busy}
            >
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnConfirmText}>Save</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnReject, pressed && { opacity: 0.8 }, busy && styles.btnDisabled]}
              onPress={() => { void handleAction('reject'); }}
              disabled={busy}
            >
              {busy ? <ActivityIndicator size="small" color={colors.danger} /> : <Text style={styles.btnRejectText}>Reject</Text>}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnCorrect, pressed && { opacity: 0.8 }, busy && styles.btnDisabled]}
              onPress={() => setCorrecting(true)}
              disabled={busy}
            >
              <Text style={styles.btnCorrectText}>Correct</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.btnConfirm, pressed && { opacity: 0.8 }, busy && styles.btnDisabled]}
              onPress={() => { void handleAction('confirm'); }}
              disabled={busy}
            >
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.btnConfirmText}>Confirm</Text>}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

export default function ExtractionReviewScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [items, setItems] = useState<ExtractionReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const all = await listExtractions(token);
      setItems(all.filter((i) => i.status === 'pending'));
    } catch {
      setError('Could not load extractions.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = useCallback(
    async (id: string, action: 'confirm' | 'correct' | 'reject', correctedValue?: string) => {
      if (!token) return;
      try {
        await reviewExtraction(token, id, action, correctedValue);
        setItems((prev) => prev.filter((i) => i._id !== id));
      } catch {
        /* leave item in list on failure */
      }
    },
    [token],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>AI Extractions</Text>
        <Text style={styles.subtitle}>Review and confirm data the AI extracted from your conversations.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.8 }]}
            onPress={() => { void load(); }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIllustration}>✓</Text>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyBody}>No pending AI extractions to review.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countLabel}>
            {items.length} item{items.length === 1 ? '' : 's'} to review
          </Text>
          {items.map((item) => (
            <ExtractionCard key={item._id} item={item} onAction={handleAction} />
          ))}
          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginBottom: spacing.md,
  },
  backBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.pageTitle,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.md,
  },
  countLabel: {
    fontSize: 12,
    color: colors.text3,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  fieldName: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  sourcePill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  extractedValue: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  correctionInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.xs,
    minHeight: 50,
  },
  extractedAt: {
    fontSize: 11,
    color: colors.text3,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnReject: {
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerMid,
  },
  btnRejectText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  btnCorrect: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCorrectText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  btnConfirm: {
    backgroundColor: colors.ok,
  },
  btnConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  btnCancel: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
  errorText: {
    fontSize: 14,
    color: colors.text2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  emptyIllustration: {
    fontSize: 48,
    color: colors.ok,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 20,
  },
});
