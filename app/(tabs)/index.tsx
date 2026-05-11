import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AISuggestionBanner } from '../../components/summary/AISuggestionBanner';
import { DoseProgressCard } from '../../components/summary/DoseProgressCard';
import { ScheduleSection } from '../../components/summary/ScheduleSection';
import {
  MOCK_SUPPLEMENTS,
  TIME_BLOCK_LABELS,
  TIME_BLOCK_ORDER,
  type SupplementEntry,
  type TimeBlock,
} from '../../components/summary/mockData';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [supplements, setSupplements] = useState<SupplementEntry[]>(MOCK_SUPPLEMENTS);

  const taken = supplements.filter((s) => s.taken).length;
  const total = supplements.length;

  const toggleTaken = (id: string) => {
    setSupplements((prev) =>
      prev.map((s) => (s.id === id ? { ...s, taken: !s.taken } : s)),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topbar: greeting + date */}
        <View style={styles.topbar}>
          <Text style={styles.dateLabel}>{formatDate()}</Text>
          <Text style={styles.greeting}>{getGreeting()}</Text>
        </View>

        {/* Dose progress hero card */}
        <DoseProgressCard taken={taken} total={total} />

        {/* Time-block schedule card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleCardHeader}>
            <Text style={styles.scheduleCardTitle}>Schedule</Text>
          </View>

          {TIME_BLOCK_ORDER.map((block: TimeBlock) => (
            <ScheduleSection
              key={block}
              label={TIME_BLOCK_LABELS[block]}
              items={supplements.filter((s) => s.timeBlock === block)}
              onToggle={toggleTaken}
            />
          ))}
        </View>

        {/* AI suggestion banner */}
        <AISuggestionBanner suggestion="You most often skip B-complex at midday. Consider moving it to your morning block to improve adherence." />

        <Text style={styles.disclaimer}>
          Not medical advice. Always consult your doctor.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPad,
    paddingBottom: spacing.xxxl,
  },

  // Topbar
  topbar: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dateLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.text2,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.pageTitle,
    color: colors.text,
  },

  // Schedule card shell
  scheduleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scheduleCardHeader: {
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scheduleCardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },

  // Disclaimer
  disclaimer: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.text4,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
