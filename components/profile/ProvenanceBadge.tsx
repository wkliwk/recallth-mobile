/**
 * ProvenanceBadge — shows the origin of a field value.
 *
 * ai_extracted  → purple  "AI extracted"
 * user_edited   → green   "User edited"
 * needs_review  → amber   "Needs review"
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Provenance } from '../../services/profile';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface Props {
  provenance: Provenance;
}

const CONFIG: Record<
  Provenance,
  { label: string; bg: string; text: string; border: string }
> = {
  ai_extracted: {
    label: 'AI extracted',
    bg: colors.aiLight,
    text: colors.ai,
    border: '#EDE9FE',
  },
  user_edited: {
    label: 'User edited',
    bg: colors.primaryLight,
    text: colors.primary,
    border: colors.primaryMid,
  },
  needs_review: {
    label: 'Needs review',
    bg: colors.warningLight,
    text: colors.warning,
    border: '#FEF3C7',
  },
};

export default function ProvenanceBadge({ provenance }: Props) {
  const cfg = CONFIG[provenance];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg, borderColor: cfg.border },
      ]}
      accessibilityLabel={cfg.label}
    >
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
