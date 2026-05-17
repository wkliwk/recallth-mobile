import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { type EffectRating } from '../../utils/effectsStorage';

const EMOJIS: Array<{ value: EffectRating['value']; label: string; emoji: string }> = [
  { value: -2, label: 'Much worse', emoji: '😣' },
  { value: -1, label: 'Worse', emoji: '😕' },
  { value: 0, label: 'Same', emoji: '😐' },
  { value: 1, label: 'Better', emoji: '🙂' },
  { value: 2, label: 'Much better', emoji: '😄' },
];

interface Props {
  visible: boolean;
  supplementName: string;
  onSave: (value: EffectRating['value'], note?: string) => void;
  onDefer: () => void;
}

export function EffectivenessCheckInSheet({ visible, supplementName, onSave, onDefer }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [selected, setSelected] = useState<EffectRating['value'] | null>(null);
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (selected === null) return;
    onSave(selected, note.trim() || undefined);
    setSelected(null);
    setNote('');
  };

  const handleDefer = () => {
    setSelected(null);
    setNote('');
    onDefer();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleDefer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>How has {supplementName} been feeling?</Text>
          <Text style={styles.subtitle}>Weekly check-in — takes 5 seconds</Text>

          <View style={styles.emojiRow}>
            {EMOJIS.map((e) => (
              <Pressable
                key={e.value}
                onPress={() => setSelected(e.value)}
                style={({ pressed }) => [
                  styles.emojiBtn,
                  selected === e.value && styles.emojiBtnSelected,
                  pressed && { opacity: 0.75 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={e.label}
              >
                <Text style={styles.emoji}>{e.emoji}</Text>
                <Text style={[styles.emojiLabel, selected === e.value && styles.emojiLabelSelected]}>
                  {e.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {selected !== null && (
            <TextInput
              style={styles.noteInput}
              placeholder="Optional note (max 140 chars)"
              placeholderTextColor={c.text3}
              value={note}
              onChangeText={(t) => setNote(t.slice(0, 140))}
              multiline
              maxLength={140}
              returnKeyType="done"
              accessibilityLabel="Optional note"
            />
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={handleSave}
              disabled={selected === null}
              style={({ pressed }) => [
                styles.saveBtn,
                selected === null && styles.saveBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save rating"
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
            <Pressable
              onPress={handleDefer}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Ask me later"
            >
              <Text style={styles.deferText}>Ask me later</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxxl,
      paddingTop: spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.bodySmall,
      color: c.text3,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    emojiRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
    },
    emojiBtn: {
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: radius.lg,
      flex: 1,
    },
    emojiBtnSelected: {
      backgroundColor: c.primaryLight,
    },
    emoji: { fontSize: 28, marginBottom: 4 },
    emojiLabel: { fontSize: 9, color: c.text3, textAlign: 'center', fontWeight: '500' },
    emojiLabelSelected: { color: c.primary, fontWeight: '700' },
    noteInput: {
      backgroundColor: c.bg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      ...typography.body,
      color: c.text,
      minHeight: 72,
      marginBottom: spacing.xl,
    },
    actions: { gap: spacing.md, alignItems: 'center' },
    saveBtn: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      width: '100%',
      alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    deferText: { fontSize: 14, color: c.text3, fontWeight: '500' },
  });
}
