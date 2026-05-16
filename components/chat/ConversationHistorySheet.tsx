import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../../utils/theme';
import { getHistory, type Conversation } from '../../services/chat';

interface Props {
  visible: boolean;
  token: string;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function conversationLabel(c: Conversation): string {
  if (c.title && c.title.trim().length > 0) return c.title.trim();
  if (c.summary && c.summary.trim().length > 0) {
    const s = c.summary.trim();
    return s.length > 60 ? s.slice(0, 57) + '…' : s;
  }
  return 'Conversation';
}

export function ConversationHistorySheet({ visible, token, activeConversationId, onSelect, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { conversations: list } = await getHistory({ token, page: 1 });
      setConversations(list);
    } catch {
      setError('Could not load history.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (visible) void load();
  }, [visible, load]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {/* prevent dismiss on sheet tap */}}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Past Conversations</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel="Close history"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error !== null ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                onPress={() => void load()}
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No past conversations.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {conversations.map((c) => {
                const isActive = c._id === activeConversationId;
                return (
                  <Pressable
                    key={c._id}
                    style={({ pressed }) => [
                      styles.row,
                      isActive && styles.rowActive,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => onSelect(c._id)}
                    accessibilityRole="button"
                    accessibilityLabel={conversationLabel(c)}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]} numberOfLines={1}>
                        {conversationLabel(c)}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {relativeDate(c.createdAt)}
                        {c.messageCount !== undefined && c.messageCount > 0
                          ? ` · ${c.messageCount} message${c.messageCount === 1 ? '' : 's'}`
                          : ''}
                      </Text>
                    </View>
                    {isActive && <Text style={styles.activeCheck}>✓</Text>}
                  </Pressable>
                );
              })}
              <View style={{ height: spacing.xxxl }} />
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.sm,
    maxHeight: '75%',
    minHeight: 200,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.text3,
    fontWeight: '600',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  errorText: {
    fontSize: 13,
    color: colors.text2,
    marginBottom: spacing.sm,
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  retryBtnText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: colors.text3,
    fontStyle: 'italic',
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowActive: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: -spacing.screenPad,
    paddingHorizontal: spacing.screenPad,
    borderRadius: radius.md,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowLeft: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  rowLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  rowMeta: {
    fontSize: 12,
    color: colors.text3,
  },
  activeCheck: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
