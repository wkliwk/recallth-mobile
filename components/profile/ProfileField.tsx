/**
 * ProfileField — a single labelled field row with inline edit support
 * and a provenance badge.
 *
 * When `editable` is true the value is shown in a TextInput;
 * otherwise it renders as plain text (or a "Not set" placeholder).
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { Provenance } from '../../services/profile';
import { colors, radius, spacing, typography } from '../../utils/theme';
import ProvenanceBadge from './ProvenanceBadge';

interface Props {
  label: string;
  value: string | number | boolean | null;
  provenance: Provenance;
  unit?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  onChangeText?: (text: string) => void;
  /** When true the field renders as an active TextInput */
  editable?: boolean;
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
  onPressEdit,
}: Props) {
  const displayValue =
    value === null || value === '' || value === undefined
      ? null
      : String(value);

  const [localText, setLocalText] = useState(displayValue ?? '');

  const handleChange = (text: string) => {
    setLocalText(text);
    onChangeText?.(text);
  };

  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <ProvenanceBadge provenance={provenance} />
      </View>

      {editable ? (
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, multiline && styles.inputMultiline]}
            value={localText}
            onChangeText={handleChange}
            keyboardType={keyboardType}
            multiline={multiline}
            placeholderTextColor={colors.text4}
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

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.bodySmall,
    color: colors.text2,
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
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    ...typography.bodySmall,
    color: colors.text3,
    fontStyle: 'italic',
    flex: 1,
  },
  unit: {
    ...typography.bodySmall,
    color: colors.text3,
  },
  editHint: {
    ...typography.bodySmall,
    color: colors.primary,
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
    color: colors.text,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
