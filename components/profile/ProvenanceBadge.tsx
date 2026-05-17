/**
 * ProvenanceBadge — shows the origin of a field value.
 *
 * ai_extracted  → purple  "AI extracted"
 * user_edited   → green   "User edited"
 * needs_review  → amber   "Needs review"
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Provenance } from '../../services/profile';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  provenance: Provenance;
}

export default function ProvenanceBadge({ provenance }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  const CONFIG: Record<
    Provenance,
    { label: string; bg: string; text: string; border: string }
  > = {
    ai_extracted: {
      label: 'AI extracted',
      bg: c.aiLight,
      text: c.ai,
      border: '#EDE9FE',
    },
    user_edited: {
      label: 'User edited',
      bg: c.primaryLight,
      text: c.primary,
      border: c.primaryMid,
    },
    needs_review: {
      label: 'Needs review',
      bg: c.warningLight,
      text: c.warning,
      border: '#FEF3C7',
    },
  };

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

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
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
}
