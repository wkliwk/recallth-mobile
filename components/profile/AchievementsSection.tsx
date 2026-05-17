import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { BADGE_DEFS, type EarnedBadge } from '../../utils/badges';

interface Props {
  earned: EarnedBadge[];
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

export default function AchievementsSection({ earned }: Props) {
  const earnedMap = new Map(earned.map((b) => [b.id, b]));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.grid}>
        {BADGE_DEFS.map((def) => (
          <BadgeItem key={def.id} def={def} earnedBadge={earnedMap.get(def.id)} />
        ))}
      </View>
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
});
