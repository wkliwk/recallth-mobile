import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import type { SupplementEntry } from './mockData';

interface Props {
  supplement: SupplementEntry | null;
  onLog: (note: string) => void;
  onCancel: () => void;
}

const MAX_NOTE = 200;

function DoseLogSheetInner({ supplement, onLog, onCancel }: Props) {
  const [note, setNote] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleLog = useCallback(() => {
    Keyboard.dismiss();
    onLog(note.trim());
    setNote('');
  }, [note, onLog]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    setNote('');
    onCancel();
  }, [onCancel]);

  if (!supplement) return null;

  const remaining = MAX_NOTE - note.length;
  const showCount = note.length >= 150;

  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleCancel} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvView}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.supplementName}>{supplement.name}</Text>
          {supplement.dose ? (
            <Text style={styles.dose}>{supplement.dose}</Text>
          ) : null}

          <View style={styles.noteWrap}>
            <TextInput
              ref={inputRef}
              style={styles.noteInput}
              placeholder="Add a note (optional)"
              placeholderTextColor={colors.text3}
              value={note}
              onChangeText={(t) => setNote(t.slice(0, MAX_NOTE))}
              maxLength={MAX_NOTE}
              returnKeyType="done"
              onSubmitEditing={handleLog}
              autoCorrect
              multiline={false}
              accessibilityLabel="Dose note input"
            />
            {showCount && (
              <Text style={styles.charCount}>{remaining}</Text>
            )}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel dose log"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleLog}
              style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Log this dose"
            >
              <Text style={styles.logText}>Log dose</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const DoseLogSheet = memo(DoseLogSheetInner);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  kvView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  supplementName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  dose: {
    ...typography.bodySmall,
    color: colors.text2,
    marginTop: -spacing.xs,
  },
  noteWrap: {
    position: 'relative',
  },
  noteInput: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    minHeight: 44,
  },
  charCount: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.xs,
    ...typography.caption,
    color: colors.text3,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
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
    ...typography.bodyStrong,
    color: colors.text2,
    fontSize: 15,
  },
  logBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  logText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
