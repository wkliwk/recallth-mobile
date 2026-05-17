import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import type { SupplementEntry } from '../summary/mockData';

interface Props {
  items: SupplementEntry[];
  yesterdayLabel: string;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

function RecoverySheetInner({ items, yesterdayLabel, onConfirm, onCancel }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.map((i) => i.id)),
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(Array.from(selected));
  }, [selected, onConfirm]);

  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Dismiss" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Recover yesterday's doses</Text>
        <Text style={styles.subtitle}>{yesterdayLabel}</Text>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {items.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
                onPress={() => toggle(item.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={item.name}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.dose ? <Text style={styles.itemDose}>{item.dose}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Cancel recovery"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => [
              styles.confirmBtn,
              selected.size === 0 && styles.confirmBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
            disabled={selected.size === 0}
            accessibilityRole="button"
            accessibilityLabel={`Log ${selected.size} dose${selected.size !== 1 ? 's' : ''} for yesterday`}
          >
            <Text style={styles.confirmText}>
              Log {selected.size} dose{selected.size !== 1 ? 's' : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export const RecoverySheet = memo(RecoverySheetInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
      maxHeight: '75%',
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.3,
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodySmall,
      color: c.text2,
      marginBottom: spacing.md,
    },
    list: {
      flexGrow: 0,
    },
    listContent: {
      gap: spacing.xs,
      paddingBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.bg,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    checkboxOn: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    checkmark: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },
    itemInfo: {
      flex: 1,
      gap: 2,
    },
    itemName: {
      ...typography.bodyStrong,
      color: c.text,
    },
    itemDose: {
      ...typography.caption,
      color: c.text3,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    cancelText: {
      ...typography.bodyStrong,
      color: c.text2,
      fontSize: 15,
    },
    confirmBtn: {
      flex: 2,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.primary,
      alignItems: 'center',
    },
    confirmBtnDisabled: {
      opacity: 0.4,
    },
    confirmText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });
}
