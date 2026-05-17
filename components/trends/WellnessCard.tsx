import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { WellnessScore } from '../../services/trends';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';
import TrendsCard from './TrendsCard';

interface Props {
  score: WellnessScore | null;
}

interface CategoryBarProps {
  label: string;
  score: number;
  max: number;
  detail: string;
  styles: ReturnType<typeof makeStyles>;
}

function CategoryBar({ label, score, max, detail, styles }: CategoryBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
  const widthLabel = `${pct}%` as `${number}%`;
  return (
    <View style={styles.catRow}>
      <View style={styles.catHead}>
        <Text style={styles.catLabel}>{label}</Text>
        <Text style={styles.catScore}>{score}/{max}</Text>
      </View>
      <View style={styles.catTrack}>
        <View style={[styles.catFill, { width: widthLabel }]} />
      </View>
      <Text style={styles.catDetail} numberOfLines={2}>
        {detail}
      </Text>
    </View>
  );
}

export default function WellnessCard({ score }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (!score) {
    return (
      <TrendsCard label="Wellness score">
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Score unavailable</Text>
          <Text style={styles.emptyBody}>
            Fill in your health profile and supplement cabinet to unlock your wellness score.
          </Text>
        </View>
      </TrendsCard>
    );
  }

  const { score: total, breakdown, tips } = score;

  return (
    <TrendsCard label="Wellness score">
      <View style={styles.scoreRow}>
        <Text style={styles.bigScore}>{total}</Text>
        <Text style={styles.scoreOutOf}> / 100</Text>
      </View>

      <View style={styles.catList}>
        <CategoryBar
          label="Profile completeness"
          score={breakdown.profileCompleteness.score}
          max={breakdown.profileCompleteness.max}
          detail={breakdown.profileCompleteness.detail}
          styles={styles}
        />
        <CategoryBar
          label="Cabinet quality"
          score={breakdown.cabinetQuality.score}
          max={breakdown.cabinetQuality.max}
          detail={breakdown.cabinetQuality.detail}
          styles={styles}
        />
        <CategoryBar
          label="Goal alignment"
          score={breakdown.goalAlignment.score}
          max={breakdown.goalAlignment.max}
          detail={breakdown.goalAlignment.detail}
          styles={styles}
        />
      </View>

      {tips && tips.length > 0 && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipsLabel}>Top tip</Text>
          <Text style={styles.tipsText}>{tips[0]}</Text>
        </View>
      )}
    </TrendsCard>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: spacing.md,
    },
    bigScore: {
      fontSize: 44,
      lineHeight: 52,
      fontWeight: '700',
      color: c.primary,
    },
    scoreOutOf: {
      ...typography.body,
      color: c.text2,
      marginLeft: 4,
    },
    catList: {
      gap: spacing.md,
    },
    catRow: {
      gap: 4,
    },
    catHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    catLabel: {
      ...typography.bodySmall,
      fontWeight: '600',
      color: c.text,
    },
    catScore: {
      ...typography.bodySmall,
      color: c.text2,
    },
    catTrack: {
      height: 6,
      backgroundColor: c.surface,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    catFill: {
      height: '100%',
      backgroundColor: c.primary,
    },
    catDetail: {
      ...typography.caption,
      color: c.text3,
    },
    tipsBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: c.primaryLight,
      borderRadius: radius.md,
      gap: 4,
    },
    tipsLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: c.primaryBright,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tipsText: {
      ...typography.bodySmall,
      color: c.text,
    },
    empty: {
      paddingVertical: spacing.sm,
      gap: 4,
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: c.text,
    },
    emptyBody: {
      ...typography.bodySmall,
      color: c.text2,
    },
  });
}
