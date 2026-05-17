import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPalette, radius, spacing } from '../utils/theme';
import { useThemeColors } from '../utils/useTheme';

type ConversationListItemProps = {
  title: string;
  subtitle: string;
  /** Icon background color token — defaults to ai-light (purple tint). */
  iconBg?: string;
  /** Icon text/SVG color — defaults to ai (purple). */
  iconColor?: string;
  onPress?: () => void;
  /** When true, renders a bottom border divider. */
  showDivider?: boolean;
};

export function ConversationListItem({
  title,
  subtitle,
  iconBg,
  iconColor,
  onPress,
  showDivider = false,
}: ConversationListItemProps) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  // Use provided overrides or fall back to theme defaults
  const resolvedIconBg = iconBg ?? c.aiLight;
  const resolvedIconColor = iconColor ?? c.ai;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.divider,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open conversation: ${title}`}
    >
      {/* Avatar tile */}
      <View style={[styles.avatar, { backgroundColor: resolvedIconBg }]}>
        {/* Sparkle icon — inline SVG not available in RN; using text glyph as stand-in */}
        <Text style={[styles.avatarIcon, { color: resolvedIconColor }]}>✦</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md - 2,
      paddingVertical: spacing.sm,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    pressed: {
      opacity: 0.75,
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarIcon: {
      fontSize: 16,
      lineHeight: 20,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: c.text,
    },
    subtitle: {
      fontSize: 12,
      lineHeight: 16,
      color: c.text3,
      marginTop: 1,
    },
    chevron: {
      fontSize: 18,
      color: c.text3,
      lineHeight: 22,
    },
  });
}
