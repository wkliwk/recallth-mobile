/**
 * AccordionSection — collapsible card section for Health Profile.
 *
 * Shows a header with title + section-level provenance badge,
 * and animates open/close.
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import type { Provenance } from '../../services/profile';
import { colors, radius, spacing, typography } from '../../utils/theme';
import ProvenanceBadge from './ProvenanceBadge';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  title: string;
  provenance: Provenance;
  children: React.ReactNode;
  /** Open by default */
  defaultOpen?: boolean;
  /** Save state */
  saveState?: 'idle' | 'saving' | 'success' | 'error';
  onSave?: () => void;
}

export default function AccordionSection({
  title,
  provenance,
  children,
  defaultOpen = false,
  saveState = 'idle',
  onSave,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const rotateAnim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !open;
    setOpen(next);
    Animated.timing(rotateAnim, {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const arrowRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const saveLabelMap: Record<string, string> = {
    idle: 'Save',
    saving: 'Saving…',
    success: 'Saved',
    error: 'Retry',
  };

  const saveBgMap: Record<string, string> = {
    idle: colors.primary,
    saving: colors.text3,
    success: colors.primary,
    error: colors.danger,
  };

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={`${title} section, ${open ? 'collapse' : 'expand'}`}
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          <ProvenanceBadge provenance={provenance} />
        </View>
        <Animated.Text
          style={[styles.arrow, { transform: [{ rotate: arrowRotation }] }]}
        >
          ▾
        </Animated.Text>
      </Pressable>

      {open ? (
        <View style={styles.body}>
          {children}
          {onSave ? (
            <View style={styles.saveRow}>
              {saveState === 'success' ? (
                <Text style={styles.successMsg}>Changes saved</Text>
              ) : null}
              {saveState === 'error' ? (
                <Text style={styles.errorMsg}>Failed to save — tap Retry</Text>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: saveBgMap[saveState] },
                  pressed && styles.saveBtnPressed,
                  saveState === 'saving' && styles.saveBtnDisabled,
                ]}
                onPress={onSave}
                disabled={saveState === 'saving'}
                accessibilityRole="button"
                accessibilityLabel={`Save ${title}`}
              >
                <Text style={styles.saveBtnText}>{saveLabelMap[saveState]}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerPressed: {
    backgroundColor: colors.cardSolid,
  },
  headerLeft: {
    gap: spacing.xs,
    flex: 1,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  arrow: {
    fontSize: 18,
    color: colors.text3,
    marginLeft: spacing.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  saveRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
    alignItems: 'flex-end',
  },
  saveBtn: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-end',
  },
  saveBtnPressed: { opacity: 0.8 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...typography.bodyStrong,
    color: colors.surface,
  },
  successMsg: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  errorMsg: {
    ...typography.bodySmall,
    color: colors.danger,
  },
});
