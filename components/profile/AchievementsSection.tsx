import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { BADGE_DEFS, type EarnedBadge } from '../../utils/badges';

interface Props {
  earned: EarnedBadge[];
  streak?: number;
  onShare?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
}

function BadgeItem({ def, earnedBadge }: { def: typeof BADGE_DEFS[0]; earnedBadge?: EarnedBadge }) {
  const isEarned = Boolean(earnedBadge);
  return (
    <View style={[styles.badge, !isEarned && styles.badgeGrey]}>
      <Text style={[styles.badgeIcon, !isEarned && styles.badgeIconGrey]}>{def.icon}</Text>
      <Text style={[styles.badgeLabel, !isEarned && styles.badgeLabelGrey]} numberOfLines={2}>
        {def.label}
      </Text>
      {earnedBadge && (
        <Text style={styles.earnedDate}>{formatDate(earnedBadge.earnedAt)}</Text>
      )}
      {!isEarned && (
        <Text style={styles.lockedText}>Locked</Text>
      )}
    </View>
  );
}

export default function AchievementsSection({ earned, streak = 0, onShare }: Props) {
  const earnedMap = new Map(earned.map((b) => [b.id, b]));
  const showShare = (streak > 0 || earned.length > 0) && Boolean(onShare);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.grid}>
        {BADGE_DEFS.map((def) => (
          <BadgeItem key={def.id} def={def} earnedBadge={earnedMap.get(def.id)} />
        ))}
      </View>
      {showShare && (
        <Pressable
          onPress={onShare}
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel="Share your progress"
        >
          <Text style={styles.shareBtnText}>🏅 Share Progress</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.screenPad,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    width: '30%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 3,
    minHeight: 90,
    justifyContent: 'center',
  },
  badgeGrey: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
  },
  badgeIcon: {
    fontSize: 28,
  },
  badgeIconGrey: {
    opacity: 0.25,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeLabelGrey: {
    color: colors.text3,
  },
  earnedDate: {
    fontSize: 9,
    color: colors.text3,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 9,
    color: colors.text3,
    fontStyle: 'italic',
  },
  shareBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
});
