import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import type { MonthlySummary, SupplementAdherence } from '../../services/insights';

interface Props {
  summary: MonthlySummary;
  onDismiss: () => void;
}

function monthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function pctColor(pct: number, c: ColorPalette): string {
  if (pct >= 80) return c.ok;
  if (pct >= 50) return c.warning;
  return '#ef4444';
}

function AdherenceRow({ item, c }: { item: SupplementAdherence; c: ColorPalette }) {
  const modalStyles = useMemo(() => makeModalStyles(c), [c]);
  const barWidth = Math.min(Math.max(item.pct, 0), 100);
  const itemPctColor = pctColor(item.pct, c);
  return (
    <View style={modalStyles.adherenceRow}>
      <View style={modalStyles.adherenceLeft}>
        <Text style={modalStyles.adherenceName} numberOfLines={1}>{item.name}</Text>
        <View style={modalStyles.barTrack}>
          <View style={[modalStyles.barFill, { width: `${barWidth}%` as `${number}%`, backgroundColor: itemPctColor }]} />
        </View>
      </View>
      <Text style={[modalStyles.adherencePct, { color: itemPctColor }]}>{item.pct}%</Text>
    </View>
  );
}

function FullReportModal({ summary, visible, onClose, c }: { summary: MonthlySummary; visible: boolean; onClose: () => void; c: ColorPalette }) {
  const modalStyles = useMemo(() => makeModalStyles(c), [c]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={modalStyles.overlay} />
      </TouchableWithoutFeedback>
      <View style={modalStyles.sheet}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerTitle}>{monthLabel(summary.month)} Report</Text>
          <Pressable onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Close report">
            <Text style={modalStyles.closeBtn}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={modalStyles.body} showsVerticalScrollIndicator={false}>
          <Text style={modalStyles.sectionLabel}>Per-supplement adherence</Text>
          {summary.supplements.map((s) => (
            <AdherenceRow key={s.name} item={s} c={c} />
          ))}
          <Text style={modalStyles.subNote}>{summary.logCount} doses logged across {summary.dayCount} days</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function MonthlySummaryCardInner({ summary, onDismiss }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [reportOpen, setReportOpen] = useState(false);

  const handleDismiss = useCallback(() => onDismiss(), [onDismiss]);

  const overallPctColor = pctColor(summary.adherencePct, c);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Your {monthLabel(summary.month)} summary</Text>
          <Pressable
            onPress={handleDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss monthly summary"
          >
            <Text style={styles.dismissBtn}>✕</Text>
          </Pressable>
        </View>

        {/* Overall adherence */}
        <View style={styles.overallRow}>
          <Text style={[styles.overallPct, { color: overallPctColor }]}>
            {summary.adherencePct}%
          </Text>
          <Text style={styles.overallLabel}>overall adherence</Text>
        </View>

        {/* Best + worst */}
        <View style={styles.statsRow}>
          {summary.bestSupplement && (
            <View style={styles.statPill}>
              <Text style={styles.statPillIcon}>⭐</Text>
              <View>
                <Text style={styles.statPillLabel}>Most consistent</Text>
                <Text style={styles.statPillName} numberOfLines={1}>{summary.bestSupplement.name}</Text>
              </View>
            </View>
          )}
          {summary.worstSupplement && (
            <View style={[styles.statPill, styles.statPillWarn]}>
              <Text style={styles.statPillIcon}>⚠</Text>
              <View>
                <Text style={[styles.statPillLabel, styles.statPillLabelWarn]}>Most missed</Text>
                <Text style={styles.statPillName} numberOfLines={1}>{summary.worstSupplement.name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* AI insight */}
        {summary.aiInsight && (
          <Text style={styles.insight}>{summary.aiInsight}</Text>
        )}

        <Pressable
          onPress={() => setReportOpen(true)}
          style={({ pressed }) => [styles.fullReportBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="View full adherence report"
        >
          <Text style={styles.fullReportText}>View full report →</Text>
        </Pressable>
      </View>

      <FullReportModal summary={summary} visible={reportOpen} onClose={() => setReportOpen(false)} c={c} />
    </>
  );
}

export const MonthlySummaryCard = memo(MonthlySummaryCardInner);

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.border,
      marginHorizontal: spacing.screenPad,
      marginBottom: spacing.md,
      padding: spacing.lg,
      gap: spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardTitle: {
      ...typography.bodyStrong,
      color: c.text,
    },
    dismissBtn: {
      fontSize: 13,
      color: c.text3,
    },
    overallRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: spacing.xs,
    },
    overallPct: {
      fontSize: 36,
      fontWeight: '800',
      lineHeight: 40,
    },
    overallLabel: {
      ...typography.body,
      color: c.text2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: '#f0fdf4',
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: '#bbf7d0',
      padding: spacing.sm,
    },
    statPillWarn: {
      backgroundColor: c.warningLight,
      borderColor: c.warningMid,
    },
    statPillIcon: { fontSize: 14 },
    statPillLabel: {
      ...typography.caption,
      color: c.ok,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    statPillLabelWarn: { color: c.warning },
    statPillName: {
      ...typography.bodySmall,
      color: c.text,
      fontWeight: '600',
    },
    insight: {
      ...typography.bodySmall,
      color: c.text2,
      fontStyle: 'italic',
      lineHeight: 20,
    },
    fullReportBtn: {
      alignSelf: 'flex-start',
    },
    fullReportText: {
      ...typography.bodySmall,
      color: c.primary,
      fontWeight: '600',
    },
  });
}

function makeModalStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '70%',
      paddingBottom: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    headerTitle: {
      ...typography.bodyStrong,
      color: c.text,
    },
    closeBtn: {
      fontSize: 16,
      color: c.text3,
    },
    body: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    sectionLabel: {
      ...typography.caption,
      color: c.text3,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    adherenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    adherenceLeft: { flex: 1, gap: 4 },
    adherenceName: {
      ...typography.bodySmall,
      color: c.text,
      fontWeight: '500',
    },
    barTrack: {
      height: 6,
      backgroundColor: c.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: 6,
      borderRadius: 3,
    },
    adherencePct: {
      ...typography.caption,
      fontWeight: '700',
      width: 36,
      textAlign: 'right',
    },
    subNote: {
      ...typography.caption,
      color: c.text3,
      marginTop: spacing.sm,
    },
  });
}
