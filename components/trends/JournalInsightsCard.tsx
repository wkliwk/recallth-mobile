import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../utils/theme';

interface Props {
  insights: string[];
  isEmpty: boolean;
  generatedAt: string | null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function JournalInsightsCard({ insights, isEmpty, generatedAt }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>AI Journal Insights</Text>
        {generatedAt !== null && (
          <Text style={styles.timestamp}>Generated {relativeTime(generatedAt)}</Text>
        )}
      </View>

      {isEmpty || insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.emptyText}>
            Log mood & energy for 5+ days to unlock AI pattern observations.
          </Text>
        </View>
      ) : (
        <View style={styles.insightsList}>
          {insights.map((insight, i) => (
            <View key={i} style={[styles.insightRow, i < insights.length - 1 && styles.insightRowDivider]}>
              <Text style={styles.insightBullet}>◆</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  timestamp: {
    fontSize: 11,
    color: colors.text3,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  lockIcon: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 13,
    color: colors.text3,
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  insightsList: {
    gap: 0,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  insightRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  insightBullet: {
    fontSize: 8,
    color: colors.primary,
    marginTop: 5,
    flexShrink: 0,
  },
  insightText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    flex: 1,
  },
});
