/**
 * ProfileField — a single labelled field row with inline edit support
 * and a provenance badge.
 *
 * When `editable` is true the value is shown in a TextInput;
 * otherwise it renders as plain text (or a "Not set" placeholder).
 */

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Provenance } from '../../services/profile';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import { PickerSheet } from './PickerSheet';
import ProvenanceBadge from './ProvenanceBadge';

interface PickerOption {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string | number | boolean | null;
  provenance: Provenance;
  unit?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  onChangeText?: (text: string) => void;
  /** When true the field renders as an active TextInput (or picker if options provided) */
  editable?: boolean;
  /** When provided alongside editable, renders as a picker instead of a TextInput */
  options?: PickerOption[];
  onPressEdit?: () => void;
}

export default function ProfileField({
  label,
  value,
  provenance,
  unit,
  keyboardType = 'default',
  multiline = false,
  onChangeText,
  editable = false,
  options,
  onPressEdit,
}: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const displayValue =
    value === null || value === '' || value === undefined
      ? null
      : String(value);

  const [localText, setLocalText] = useState(displayValue ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleChange = (text: string) => {
    setLocalText(text);
    onChangeText?.(text);
  };

  const displayLabel = options
    ? (options.find((o) => o.value === localText)?.label ?? localText)
    : null;

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <ProvenanceBadge provenance={provenance} />
      </View>

      {editable && options ? (
        <>
          <Pressable
            style={({ pressed }) => [styles.pickerRow, pressed && { opacity: 0.7 }]}
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${label}`}
          >
            <Text style={displayLabel || localText ? styles.pickerValue : styles.placeholder}>
              {displayLabel || localText || `Select ${label.toLowerCase()}`}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <PickerSheet
            visible={pickerOpen}
            title={`Select ${label}`}
            options={options}
            selected={localText}
            onSelect={(v) => {
              setLocalText(v);
              onChangeText?.(v);
            }}
            onClose={() => setPickerOpen(false)}
          />
        </>
      ) : editable ? (
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, multiline && styles.inputMultiline]}
            value={localText}
            onChangeText={handleChange}
            keyboardType={keyboardType}
            multiline={multiline}
            placeholderTextColor={c.text4}
            placeholder={`Enter ${label.toLowerCase()}`}
            accessibilityLabel={`${label} input`}
          />
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
      ) : (
        <TouchableOpacity
          onPress={onPressEdit}
          disabled={!onPressEdit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          accessibilityHint="Tap to edit"
        >
          <View style={styles.valueRow}>
            {displayValue ? (
              <Text style={styles.value}>
                {displayValue}
                {unit ? <Text style={styles.unit}> {unit}</Text> : null}
              </Text>
            ) : (
              <Text style={styles.placeholder}>Not set — mention in chat to auto-fill</Text>
            )}
            {onPressEdit ? <Text style={styles.editHint}>Edit</Text> : null}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      ...typography.bodySmall,
      color: c.text2,
      fontWeight: '600',
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 28,
    },
    value: {
      ...typography.body,
      color: c.text,
      flex: 1,
    },
    placeholder: {
      ...typography.bodySmall,
      color: c.text3,
      fontStyle: 'italic',
      flex: 1,
    },
    unit: {
      ...typography.bodySmall,
      color: c.text3,
    },
    editHint: {
      ...typography.bodySmall,
      color: c.primary,
      fontWeight: '600',
      marginLeft: spacing.sm,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: c.text,
      backgroundColor: c.bg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.borderStrong,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 40,
    },
    inputMultiline: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.bg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.borderStrong,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 40,
    },
    pickerValue: {
      ...typography.body,
      color: c.text,
      flex: 1,
    },
    chevron: {
      fontSize: 20,
      color: c.text3,
      marginLeft: spacing.xs,
    },
  });
}
