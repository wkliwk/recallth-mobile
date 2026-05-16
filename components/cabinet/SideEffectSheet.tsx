import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { logSideEffect } from '../../services/sideEffects';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface Props {
  visible: boolean;
  cabinetItemId: string;
  supplementName: string;
  onClose: () => void;
}

const RATINGS = [1, 2, 3, 4, 5];
const RATING_LABELS: Record<number, string> = {
  1: 'Mild',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Severe',
};

export function SideEffectSheet({ visible, cabinetItemId, supplementName, onClose }: Props) {
  const token = useAuthStore((s) => s.token);
  const [symptom, setSymptom] = useState('');
  const [rating, setRating] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      setSymptom('');
      setRating(3);
      setSaving(false);
      setError(null);
      setSuccess(false);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  const handleSubmit = async () => {
    const trimmed = symptom.trim();
    if (!trimmed) {
      setError('Please describe the symptom.');
      return;
    }
    if (!token) {
      setError('Not signed in.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await logSideEffect(token, cabinetItemId, trimmed, rating);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch {
      setError('Failed to log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Log Side Effect</Text>
          <Text style={styles.subtitle}>{supplementName}</Text>

          {/* Symptom input */}
          <Text style={styles.label}>Symptom / Reaction</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Nausea, headache, stomach upset…"
            placeholderTextColor={colors.text4}
            value={symptom}
            onChangeText={(t) => { setSymptom(t); setError(null); }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!saving && !success}
          />

          {/* Rating picker */}
          <Text style={styles.label}>Severity</Text>
          <View style={styles.severityRow}>
            {RATINGS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRating(r)}
                style={[styles.severityBtn, rating === r && styles.severityBtnActive]}
              >
                <Text style={[styles.severityNum, rating === r && styles.severityNumActive]}>
                  {r}
                </Text>
                <Text style={[styles.severityLabel, rating === r && styles.severityLabelActive]}>
                  {RATING_LABELS[r]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Error / success */}
          {error !== null && <Text style={styles.errorText}>{error}</Text>}
          {success && <Text style={styles.successText}>Logged successfully!</Text>}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                (saving || success) && styles.submitBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => { void handleSubmit(); }}
              disabled={saving || success}
            >
              <Text style={styles.submitText}>
                {saving ? 'Logging…' : success ? 'Logged!' : 'Submit'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.pageTitle,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text2,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    minHeight: 80,
    marginBottom: spacing.xl,
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  severityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  severityNum: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text2,
  },
  severityNumActive: {
    color: colors.primary,
  },
  severityLabel: {
    fontSize: 10,
    color: colors.text3,
    marginTop: 2,
  },
  severityLabelActive: {
    color: colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: 13,
    color: colors.ok,
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text2,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
