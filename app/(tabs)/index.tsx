import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ConversationListItem } from '../../components/ConversationListItem';
import { HeroCard } from '../../components/HeroCard';
import { InteractionBanner } from '../../components/InteractionBanner';
import { SkeletonRow } from '../../components/SkeletonRow';
import { StatTile } from '../../components/StatTile';
import { fetchDashboard, type DashboardData } from '../../services/dashboard';
import { useAuthStore } from '../../stores/auth';
import { colors, radius, spacing, typography } from '../../utils/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatConversationDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHrs < 1) return 'Just now';
  if (diffHrs < 2) return '1 hour ago';
  if (diffHrs < 24) return `${Math.floor(diffHrs)} hours ago`;
  if (diffDays < 2) return 'Yesterday';
  return `${Math.floor(diffDays)} days ago`;
}

function getInitials(email: string | undefined): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

// ─── Screen ──────────────────────────────────────────────────────────────────

type LoadState = 'loading' | 'success' | 'error';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [data, setData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      if (!isRefresh) setLoadState('loading');
      try {
        const result = await fetchDashboard(token);
        setData(result);
        setLoadState('success');
      } catch {
        setLoadState('error');
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  // ─── Navigation helpers ───────────────────────────────────────────────────

  const goToChat = useCallback(
    (_prompt?: string) => {
      // Chat tab not yet built — route placeholder.
      // TODO: replace with router.push('/(tabs)/chat', { params: { prompt } })
      //       once the Chat tab is scaffolded in a follow-up issue.
      router.push('/(tabs)' as never);
    },
    [router],
  );

  // ─── Derived state ────────────────────────────────────────────────────────

  const stats = data?.stats;
  const conversations = data?.recentConversations ?? [];
  const interactions = data?.interactions ?? [];
  const highestSeverity: 'moderate' | 'major' =
    interactions.some((i) => i.severity === 'major') ? 'major' : 'moderate';

  const initials = getInitials(user?.email);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Soft green-tinted background at top — mirrors design gradient */}
        <View style={styles.topGradient} pointerEvents="none" />

        {/* Greeting row */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingLabel}>{getGreeting()}</Text>
            <Text style={styles.greetingName}>
              {user?.email?.split('@')[0] ?? 'there'}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        </View>

        {/* Hero chat input card */}
        <HeroCard
          onInputPress={() => goToChat()}
          onPromptPress={(prompt) => goToChat(prompt)}
        />

        {/* 3-stat row */}
        <View style={styles.statsRow}>
          {loadState === 'loading' ? (
            <>
              <SkeletonRow variant="stat" />
              <SkeletonRow variant="stat" />
              <SkeletonRow variant="stat" />
            </>
          ) : (
            <>
              <StatTile
                value={stats ? `${stats.profilePct}%` : '—'}
                label="Profile"
                valueColor={colors.primary}
              />
              <StatTile
                value={stats?.cabinetCount ?? '—'}
                label="Cabinet"
                valueColor={colors.text}
              />
              <StatTile
                value={stats?.alertCount ?? '—'}
                label="Alerts"
                valueColor={
                  (stats?.alertCount ?? 0) > 0 ? colors.warning : colors.text3
                }
                bgColor={
                  (stats?.alertCount ?? 0) > 0
                    ? colors.warningLight
                    : colors.surface
                }
                borderColor={
                  (stats?.alertCount ?? 0) > 0 ? '#FEF3C7' : colors.border
                }
              />
            </>
          )}
        </View>

        {/* Interaction banner — renders only when severity >= moderate */}
        {loadState === 'success' && interactions.length > 0 && (
          <InteractionBanner
            count={interactions.length}
            severity={highestSeverity}
            onReview={() => {
              // TODO: navigate to /(tabs)/cabinet once Cabinet tab is built
            }}
          />
        )}

        {/* Recent conversations card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>Recent Conversations</Text>
            {loadState === 'success' && conversations.length > 0 && (
              <Pressable
                onPress={() => {
                  // TODO: navigate to History tab once built
                }}
                accessibilityRole="button"
                accessibilityLabel="See all conversations"
              >
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            )}
          </View>

          {loadState === 'loading' && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {loadState === 'error' && (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>Could not load conversations.</Text>
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                accessibilityLabel="Retry loading conversations"
              >
                <Text style={styles.retryText}>Tap to retry</Text>
              </Pressable>
            </View>
          )}

          {loadState === 'success' && conversations.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                Start one above — ask about your supplements or health goals.
              </Text>
            </View>
          )}

          {loadState === 'success' &&
            conversations.map((convo, idx) => {
              const isLast = idx === conversations.length - 1;
              const subtitle = [
                formatConversationDate(convo.createdAt),
                convo.messageCount > 0
                  ? `${convo.messageCount} messages`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <ConversationListItem
                  key={convo._id}
                  title={convo.title ?? convo.firstMessage ?? 'Conversation'}
                  subtitle={subtitle}
                  showDivider={!isLast}
                  onPress={() => {
                    // TODO: navigate to /(tabs)/chat?conversationId={convo._id}
                    //       once Chat tab is implemented
                  }}
                />
              );
            })}
        </View>

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

  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: colors.primaryLight,
    opacity: 0.5,
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  greetingLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text2,
  },
  greetingName: {
    ...typography.pageTitle,
    color: colors.text,
    textTransform: 'capitalize',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 14,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  seeAll: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.primary,
  },

  // Empty state
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.bodyStrong,
    color: colors.text2,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.text3,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Error state
  errorState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    textAlign: 'center',
  },
  retryText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
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
