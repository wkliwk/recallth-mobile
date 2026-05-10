import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../utils/theme';

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
  iconBg = colors.aiLight,
  iconColor = colors.ai,
  onPress,
  showDivider = false,
}: ConversationListItemProps) {
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
      <View style={[styles.avatar, { backgroundColor: iconBg }]}>
        {/* Sparkle icon — inline SVG not available in RN; using text glyph as stand-in */}
        <Text style={[styles.avatarIcon, { color: iconColor }]}>✦</Text>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md - 2,
    paddingVertical: spacing.sm,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text3,
    marginTop: 1,
  },
  chevron: {
    fontSize: 18,
    color: colors.text3,
    lineHeight: 22,
  },
});
