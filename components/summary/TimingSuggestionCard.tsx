import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import type { TimingSuggestion } from '../../utils/timingOptimiser';

interface Props {
  suggestion: TimingSuggestion;
  onUpdate: (suggestion: TimingSuggestion) => void;
  onDismiss: (supplementId: string) => void;
}

function TimingSuggestionCardInner({ suggestion, onUpdate, onDismiss }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const handleUpdate = useCallback(() => onUpdate(suggestion), [onUpdate, suggestion]);
  const handleDismiss = useCallback(() => onDismiss(suggestion.supplementId), [onDismiss, suggestion.supplementId]);

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.label}>Timing insight</Text>
        <Text style={styles.message}>
          You usually take <Text style={styles.bold}>{suggestion.supplementName}</Text> around{' '}
          <Text style={styles.bold}>{suggestion.label}</Text> — want to update the schedule?
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={handleUpdate}
          style={({ pressed }) => [styles.updateBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel={`Update ${suggestion.supplementName} schedule to ${suggestion.label}`}
        >
          <Text style={styles.updateBtnText}>Update</Text>
        </Pressable>
        <Pressable
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss timing suggestion for ${suggestion.supplementName}`}
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const TimingSuggestionCard = memo(TimingSuggestionCardInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.infoLight,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: '#bfdbfe',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
      marginHorizontal: spacing.screenPad,
      marginBottom: spacing.sm,
    },
    cardLeft: { flex: 1, gap: 3 },
    label: {
      ...typography.caption,
      color: c.info,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    message: {
      ...typography.bodySmall,
      color: c.text,
    },
    bold: {
      fontWeight: '700',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flexShrink: 0,
    },
    updateBtn: {
      backgroundColor: c.info,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
    },
    updateBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#fff',
    },
    dismissText: {
      fontSize: 13,
      color: c.text3,
    },
  });
}
