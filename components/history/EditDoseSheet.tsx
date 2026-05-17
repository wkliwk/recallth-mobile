import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DoseLogEntry } from '../../services/schedule';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface Props {
  entry: DoseLogEntry | null;
  visible: boolean;
  onSave: (logId: string, takenAt: string, notes: string) => Promise<void>;
  onClose: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export function EditDoseSheet({ entry, visible, onSave, onClose }: Props) {
  const [time, setTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry && visible) {
      setTime(new Date(entry.takenAt));
      setNotes(entry.notes ?? '');
    }
  }, [entry, visible]);

  const handleSave = useCallback(async () => {
    if (!entry) return;
    setSaving(true);
    try {
      const original = new Date(entry.takenAt);
      const updated = new Date(original);
      updated.setHours(time.getHours(), time.getMinutes(), 0, 0);
      await onSave(entry._id, updated.toISOString(), notes);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save changes';
      Alert.alert('Save failed', msg);
    } finally {
      setSaving(false);
    }
  }, [entry, time, notes, onSave, onClose]);

  if (!entry) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.title}>Edit dose log</Text>
          <Text style={styles.subtitle}>
            {entry.supplementName} · {formatDate(entry.takenAt)}
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Time logged</Text>
            <DateTimePicker
              value={time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => { if (date) setTime(date); }}
              accessibilityLabel="Select log time"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any notes about this dose…"
              placeholderTextColor={colors.text3}
              multiline
              maxLength={500}
              accessibilityLabel="Dose notes"
            />
            <Text style={styles.charCount}>{notes.length}/500</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => { void handleSave(); }}
              disabled={saving}
              style={({ pressed }) => [styles.saveBtn, (pressed || saving) && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Save dose log changes"
            >
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text2,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    color: colors.text2,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optional: {
    color: colors.text3,
    fontWeight: '400',
  },
  notesInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.cardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    color: colors.text3,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.cta,
    color: colors.text2,
  },
  saveBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveText: {
    ...typography.cta,
    color: '#fff',
  },
});
