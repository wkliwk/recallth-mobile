import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

export interface EffectRatings {
  energy?: number;
  focus?: number;
  sleep?: number;
  mood?: number;
}

interface Props {
  visible: boolean;
  supplementName: string;
  onSubmit: (ratings: EffectRatings) => void;
  onSkip: () => void;
}

const CATEGORIES: { key: keyof EffectRatings; label: string; emoji: string }[] = [
  { key: 'energy', label: 'Energy', emoji: '⚡' },
  { key: 'focus',  label: 'Focus',  emoji: '🎯' },
  { key: 'sleep',  label: 'Sleep',  emoji: '😴' },
  { key: 'mood',   label: 'Mood',   emoji: '😊' },
];

const STARS = [1, 2, 3, 4, 5];

function StarRow({
  label,
  emoji,
  value,
  onChange,
  styles,
}: {
  label: string;
  emoji: string;
  value: number | undefined;
  onChange: (v: number) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.starRow}>
      <View style={styles.starLabel}>
        <Text style={styles.starEmoji}>{emoji}</Text>
        <Text style={styles.starLabelText}>{label}</Text>
      </View>
      <View style={styles.stars}>
        {STARS.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === n }}
            accessibilityLabel={`${label} ${n} out of 5`}
          >
            <Text style={[styles.star, value !== undefined && n <= value && styles.starFilled]}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function EffectRatingSheetInner({ visible, supplementName, onSubmit, onSkip }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const [ratings, setRatings] = useState<EffectRatings>({});

  const handleChange = useCallback((key: keyof EffectRatings, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(ratings);
    setRatings({});
  }, [ratings, onSubmit]);

  const handleSkip = useCallback(() => {
    setRatings({});
    onSkip();
  }, [onSkip]);

  const hasAnyRating = Object.values(ratings).some((v) => v !== undefined);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleSkip}>
      <TouchableWithoutFeedback onPress={handleSkip}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>How do you feel?</Text>
        <Text style={styles.subtitle}>
          After taking <Text style={styles.bold}>{supplementName}</Text> — optional
        </Text>

        <View style={styles.categories}>
          {CATEGORIES.map(({ key, label, emoji }) => (
            <StarRow
              key={key}
              label={label}
              emoji={emoji}
              value={ratings[key]}
              onChange={(v) => handleChange(key, v)}
              styles={styles}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Skip rating"
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={!hasAnyRating}
            style={({ pressed }) => [styles.submitBtn, !hasAnyRating && styles.submitBtnDisabled, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Submit rating"
          >
            <Text style={styles.submitBtnText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export const EffectRatingSheet = memo(EffectRatingSheetInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: 34,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: c.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.bodySmall,
      color: c.text3,
      textAlign: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
    },
    bold: { fontWeight: '700', color: c.text2 },
    categories: { gap: spacing.md },
    starRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    starLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, width: 80 },
    starEmoji: { fontSize: 16 },
    starLabelText: { ...typography.bodySmall, color: c.text, fontWeight: '500' },
    stars: { flexDirection: 'row', gap: spacing.xs },
    star: { fontSize: 26, color: c.border },
    starFilled: { color: '#f59e0b' },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    skipBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    skipBtnText: { ...typography.body, color: c.text3 },
    submitBtn: {
      flex: 2,
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.primary,
    },
    submitBtnDisabled: { backgroundColor: c.border },
    submitBtnText: { ...typography.body, color: '#fff', fontWeight: '700' },
  });
}
