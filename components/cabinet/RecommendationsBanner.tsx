import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { type Recommendation } from '../../services/recommendations';

interface Props {
  recommendations: Recommendation[];
  dismissed: string[];
  onDismiss: (name: string) => void;
  onSelect: (rec: Recommendation) => void;
}

function RecommendationCard({
  rec,
  onDismiss,
  onSelect,
}: {
  rec: Recommendation;
  onDismiss: (name: string) => void;
  onSelect: (rec: Recommendation) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => onSelect(rec)}
      accessibilityRole="button"
      accessibilityLabel={`Add ${rec.name} — ${rec.benefit}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName} numberOfLines={1}>{rec.name}</Text>
        <Pressable
          onPress={() => onDismiss(rec.name)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${rec.name}`}
          style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.dismissText}>✕</Text>
        </Pressable>
      </View>
      {rec.dosage && (
        <Text style={styles.cardMeta}>{rec.dosage}{rec.frequency ? ` · ${rec.frequency}` : ''}</Text>
      )}
      <Text style={styles.cardBenefit} numberOfLines={2}>{rec.benefit}</Text>
      <Text style={styles.cardCta}>+ Add to cabinet</Text>
    </Pressable>
  );
}

function RecommendationsBannerInner({ recommendations, dismissed, onDismiss, onSelect }: Props) {
  const visible = recommendations.filter((r) => !dismissed.includes(r.name));
  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recommended for you</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {visible.map((rec) => (
          <RecommendationCard
            key={rec.name}
            rec={rec}
            onDismiss={onDismiss}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export const RecommendationsBanner = memo(RecommendationsBannerInner);

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  scroll: {
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  card: {
    width: 200,
    backgroundColor: colors.aiLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.aiMid,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardName: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  dismissBtn: {
    paddingLeft: spacing.xs,
  },
  dismissText: {
    fontSize: 12,
    color: colors.text3,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.text3,
  },
  cardBenefit: {
    ...typography.bodySmall,
    color: colors.text2,
    lineHeight: 18,
  },
  cardCta: {
    ...typography.caption,
    color: colors.ai,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
