import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { EvidenceBar } from './EvidenceBar';

export type EvidenceLevel = 'High' | 'Moderate' | 'Limited';
export type SupplementStatus = 'ok' | 'conflict';

export interface CabinetMockItem {
  name: string;
  dose: string;
  schedule: string;
  evidence: EvidenceLevel;
  pct: number;
  status: SupplementStatus;
  stock?: number;
  conflictNote?: string;
}

interface CabinetCardProps {
  item: CabinetMockItem;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export function CabinetCard({ item, isExpanded, onToggle, onDelete }: CabinetCardProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.card,
        isExpanded && styles.cardExpanded,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.dose}, ${item.schedule}${item.status === 'conflict' ? ', conflict' : ''}`}
      accessibilityHint={isExpanded ? 'Tap to collapse details' : 'Tap to expand details'}
    >
      {/* Top row: avatar + info */}
      <View style={styles.topRow}>
        {/* Letter avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{item.name[0]}</Text>
        </View>

        {/* Name, dose, conflict pill */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            {item.status === 'conflict' && (
              <View style={styles.conflictPill}>
                <View style={styles.conflictDot} />
                <Text style={styles.conflictPillText}>Conflict</Text>
              </View>
            )}
          </View>
          <Text style={styles.dose}>{item.dose} · {item.schedule}</Text>

          {/* Evidence bar */}
          <EvidenceBar level={item.evidence} pct={item.pct} />
        </View>
      </View>

      {/* Expanded panel */}
      {isExpanded && (
        <View style={styles.expandedPanel}>
          <View style={styles.divider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>STOCK</Text>
              <Text style={styles.statValue}>
                {item.stock !== undefined ? `${item.stock} days` : '—'}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>ADHERENCE</Text>
              <Text style={styles.statValue}>91%</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>SINCE</Text>
              <Text style={styles.statValue}>Jan 14</Text>
            </View>
          </View>

          {/* Conflict note */}
          {item.status === 'conflict' && item.conflictNote !== undefined && (
            <View style={styles.conflictNote}>
              <Text style={styles.conflictNoteText}>⚠ {item.conflictNote}</Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name}`}
            >
              <Text style={styles.actionBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`History for ${item.name}`}
            >
              <Text style={styles.actionBtnText}>History</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionBtnDanger, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item.name}`}
              onPress={onDelete}
            >
              <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardExpanded: {
    borderColor: colors.primary,
  },
  cardPressed: {
    opacity: 0.92,
  },
  topRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 22,
    color: colors.text2,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  dose: {
    fontSize: 12,
    color: colors.text2,
    marginTop: 3,
    fontWeight: '400',
  },
  conflictPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningLight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
  conflictDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  conflictPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warning,
  },

  // Expanded panel
  expandedPanel: {
    marginTop: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.text,
    marginTop: 2,
  },
  conflictNote: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
  },
  conflictNoteText: {
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerMid,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtnTextDanger: {
    color: colors.danger,
  },
});
