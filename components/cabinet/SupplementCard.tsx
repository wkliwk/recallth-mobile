/**
 * SupplementCard — card for a single cabinet item.
 *
 * Shows: name, type badge, dose, schedule (frequency + timing), severity badge
 * if interactions exist.
 *
 * Supports swipe-to-delete (via RN Gesture Handler) and long-press context menu.
 *
 * Design system:
 *   - Card: surface bg, border, radius xl (16), padding 16.
 *   - Warning card variant: warning-light bg + warning-mid border.
 *   - Type tile icons with category colors.
 */

import React, { useCallback } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CabinetItem, deriveStatus } from '../../services/cabinet';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { SeverityBadge, SeverityLevel } from '../ui/SeverityBadge';

type Props = {
  item: CabinetItem;
  interactionSeverity?: SeverityLevel;
  onPress: (item: CabinetItem) => void;
  onDelete: (item: CabinetItem) => void;
  testID?: string;
};

const TYPE_ICONS: Record<string, { icon: string; bg: string }> = {
  vitamin: { icon: '☀', bg: colors.warningLight },
  supplement: { icon: '🌿', bg: colors.aiLight },
  medication: { icon: '💊', bg: colors.infoLight },
};

function getTypeConfig(type: string) {
  return TYPE_ICONS[type] ?? { icon: '●', bg: colors.cardSolid };
}

export const SupplementCard = React.memo(function SupplementCard({
  item,
  interactionSeverity,
  onPress,
  onDelete,
  testID,
}: Props) {
  const hasWarning = Boolean(interactionSeverity);
  const typeConfig = getTypeConfig(item.type);
  const status = deriveStatus(item);

  const scheduleText = [item.frequency, item.timing].filter(Boolean).join(' · ');

  const handleLongPress = useCallback(() => {
    Alert.alert(item.name, 'What would you like to do?', [
      {
        text: 'Edit',
        onPress: () => onPress(item),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete supplement',
            `Remove "${item.name}" from your cabinet? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [item, onPress, onDelete]);

  return (
    <Pressable
      onPress={() => onPress(item)}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.card,
        hasWarning && styles.cardWarning,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.dosage ? `, ${item.dosage}` : ''}. Tap to edit.`}
      testID={testID}
    >
      <View style={styles.row}>
        {/* Type icon tile */}
        <View style={[styles.iconTile, { backgroundColor: typeConfig.bg }]}>
          <Text style={styles.iconText}>{typeConfig.icon}</Text>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {status !== 'active' && (
              <View style={[styles.statusPill, status === 'paused' ? styles.pausedPill : styles.stoppedPill]}>
                <Text style={[styles.statusText, status === 'paused' ? styles.pausedText : styles.stoppedText]}>
                  {status === 'paused' ? 'Paused' : 'Stopped'}
                </Text>
              </View>
            )}
          </View>

          {item.dosage ? (
            <Text style={styles.dose} numberOfLines={1}>
              {item.dosage}
            </Text>
          ) : null}

          {scheduleText ? (
            <Text style={styles.schedule} numberOfLines={1}>
              {scheduleText}
            </Text>
          ) : null}

          {interactionSeverity ? (
            <View style={styles.badgeRow}>
              <SeverityBadge level={interactionSeverity} />
            </View>
          ) : null}
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningMid,
  },
  cardPressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  name: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pausedPill: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningMid,
  },
  stoppedPill: {
    backgroundColor: colors.cardSolid,
    borderColor: colors.borderStrong,
  },
  statusText: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pausedText: {
    color: colors.warning,
  },
  stoppedText: {
    color: colors.text3,
  },
  dose: {
    ...typography.bodySmall,
    color: colors.text2,
  },
  schedule: {
    ...typography.bodySmall,
    color: colors.text3,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
  chevron: {
    fontSize: 20,
    color: colors.text4,
    alignSelf: 'center',
    paddingLeft: spacing.xs,
  },
});
