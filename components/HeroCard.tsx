import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../utils/theme';
import { useThemeColors } from '../utils/useTheme';

type QuickPrompt = {
  id: string;
  label: string;
};

const DEFAULT_PROMPTS: QuickPrompt[] = [
  { id: '1', label: 'Should I take D3 with food?' },
  { id: '2', label: 'Check my interactions' },
  { id: '3', label: 'Best time for magnesium?' },
];

type HeroCardProps = {
  /** Called when the input field is tapped (navigates to Chat tab). */
  onInputPress: () => void;
  /** Called when a quick-prompt chip is tapped. Receives the prompt label. */
  onPromptPress: (prompt: string) => void;
};

/**
 * Hero "Ask Recallth" card — the primary entry point on the Home screen.
 * The text input is read-only; tapping it or a quick-prompt chip routes to
 * the AI Chat tab with the prompt pre-filled (navigation handled by parent).
 */
export function HeroCard({ onInputPress, onPromptPress }: HeroCardProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarIcon}>✦</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>What's on your mind?</Text>
          <Text style={styles.headerSubtitle}>I remember everything about your health</Text>
        </View>
      </View>

      {/* Tap-to-chat input (not editable — navigates to Chat on tap) */}
      <Pressable
        style={({ pressed }) => [styles.inputRow, pressed && styles.inputRowPressed]}
        onPress={onInputPress}
        accessibilityRole="button"
        accessibilityLabel="Ask Recallth about your supplements"
      >
        <TextInput
          style={styles.inputPlaceholder}
          placeholder="Ask about supplements, dosing…"
          placeholderTextColor={c.text3}
          editable={false}
          pointerEvents="none"
        />
        <Text style={styles.micIcon}>🎤</Text>
      </Pressable>

      {/* Quick-prompt chips */}
      <View style={styles.chips}>
        {DEFAULT_PROMPTS.map((p) => (
          <Pressable
            key={p.id}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => onPromptPress(p.label)}
            accessibilityRole="button"
            accessibilityLabel={`Quick prompt: ${p.label}`}
          >
            <Text style={styles.chipText}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.aiLight,
      borderColor: '#EDE9FE', // ai-mid
      borderWidth: 1,
      borderRadius: radius.xl,
      padding: spacing.xl,
      marginBottom: 14,
      // Elevated card shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md - 2,
      marginBottom: 14,
    },
    aiAvatar: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: c.ai,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiAvatarIcon: {
      color: '#fff',
      fontSize: 18,
      lineHeight: 22,
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
      color: c.text,
    },
    headerSubtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: c.text2,
      marginTop: 1,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    inputRowPressed: {
      opacity: 0.85,
    },
    inputPlaceholder: {
      flex: 1,
      fontSize: 14,
      lineHeight: 18,
      color: c.text3,
      // Prevent text input interaction
    },
    micIcon: {
      fontSize: 16,
      color: c.text3,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipPressed: {
      opacity: 0.75,
    },
    chipText: {
      fontSize: 12,
      lineHeight: 16,
      color: c.text2,
    },
  });
}
