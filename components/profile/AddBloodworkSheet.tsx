import React, { useMemo, useState } from 'react';
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
import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { createBloodworkEntry, type BloodworkEntry, type CreateBloodworkInput } from '../../services/bloodwork';

interface Props {
  visible: boolean;
  token: string;
  onClose: () => void;
  onSaved: (entry: BloodworkEntry) => void;
}

const today = new Date().toISOString().slice(0, 10);

export function AddBloodworkSheet({ visible, token, onClose, onSaved }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [date, setDate] = useState(today);
  const [marker, setMarker] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [refLow, setRefLow] = useState('');
  const [refHigh, setRefHigh] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setDate(today);
    setMarker('');
    setValue('');
    setUnit('');
    setRefLow('');
    setRefHigh('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) { setError('Date must be YYYY-MM-DD'); return; }
    if (!marker.trim()) { setError('Marker name is required'); return; }
    const numValue = parseFloat(value);
    if (isNaN(numValue)) { setError('Value must be a number'); return; }
    if (!unit.trim()) { setError('Unit is required'); return; }

    const input: CreateBloodworkInput = {
      date,
      marker: marker.trim(),
      value: numValue,
      unit: unit.trim(),
    };
    if (refLow.trim()) { const n = parseFloat(refLow); if (!isNaN(n)) input.refLow = n; }
    if (refHigh.trim()) { const n = parseFloat(refHigh); if (!isNaN(n)) input.refHigh = n; }

    setSaving(true);
    setError(null);
    try {
      const entry = await createBloodworkEntry(input, token);
      onSaved(entry);
      reset();
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Dismiss" />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.title}>Add Blood Marker</Text>
            <Pressable onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} placeholder="2026-05-16" keyboardType="numbers-and-punctuation" />
            <Field label="Marker name" value={marker} onChangeText={setMarker} placeholder="Vitamin D" />
            <Field label="Value" value={value} onChangeText={setValue} placeholder="42" keyboardType="decimal-pad" />
            <Field label="Unit" value={unit} onChangeText={setUnit} placeholder="ng/mL" />
            <Field label="Ref low (optional)" value={refLow} onChangeText={setRefLow} placeholder="30" keyboardType="decimal-pad" />
            <Field label="Ref high (optional)" value={refHigh} onChangeText={setRefHigh} placeholder="100" keyboardType="decimal-pad" />

            {error !== null && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              onPress={() => { void handleSave(); }}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && styles.saveBtnDisabled]}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Save bloodwork entry"
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Save Marker</Text>}
            </Pressable>

            <View style={{ height: spacing.xxxl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'numbers-and-punctuation';
}) {
  const c = useThemeColors();
  const fieldStyles = useMemo(() => makeFieldStyles(c), [c]);
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.text4}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function makeFieldStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.md },
    label: { fontSize: 12, fontWeight: '600', color: c.text2, marginBottom: spacing.xs },
    input: {
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 14,
      color: c.text,
    },
  });
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingHorizontal: spacing.screenPad,
      paddingTop: spacing.sm,
      maxHeight: '90%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    title: { fontSize: 17, fontWeight: '700', color: c.text },
    closeBtn: { fontSize: 14, color: c.text3, fontWeight: '600' },
    errorText: { fontSize: 12, color: c.danger, marginBottom: spacing.md },
    saveBtn: {
      backgroundColor: c.primary,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
