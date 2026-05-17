/**
 * HistoryRow — a single item in the history timeline.
 *
 * Renders three variants:
 *   - conversation: green icon, summary, message count, tappable → chat
 *   - cabinet_change: purple icon, action + item name, read-only
 *   - profile_change: amber icon, field changed, read-only
 */

import React, { memo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AnyHistoryEntry,
  CabinetChangeEntry,
  ConversationEntry,
  DoseEntry,
  ProfileChangeEntry,
} from '../../services/history';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface Props {
  item: AnyHistoryEntry;
  onPressChatItem?: (conversationId: string) => void;
  onDeleteDose?: (logId: string) => void;
  doseNotes?: Record<string, string>;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ConversationRow({
  item,
  onPress,
}: {
  item: ConversationEntry;
  onPress?: (id: string) => void;
}): React.JSX.Element {
  const id = item.data._id;
  const preview = item.data.firstMessage ?? item.summary;
  const count = item.data.messageCount;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onPress?.(id)}
      accessibilityRole="button"
      accessibilityLabel={`Conversation: ${item.summary}. ${count} messages. Tap to resume.`}
    >
      <View style={[styles.iconWrap, styles.iconChat]}>
        <Text style={styles.iconText}>💬</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.summary || 'Conversation'}
          </Text>
          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
        </View>
        {preview ? (
          <Text style={styles.preview} numberOfLines={2}>
            {preview}
          </Text>
        ) : null}
        <Text style={styles.meta}>{count} {count === 1 ? 'message' : 'messages'}</Text>
      </View>
    </Pressable>
  );
}

function CabinetRow({ item }: { item: CabinetChangeEntry }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, styles.iconCabinet]}>
        <Text style={styles.iconText}>🗄️</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.summary}
          </Text>
          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.meta}>Cabinet change</Text>
      </View>
    </View>
  );
}

function ProfileRow({ item }: { item: ProfileChangeEntry }): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, styles.iconProfile]}>
        <Text style={styles.iconText}>👤</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.summary}
          </Text>
          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.meta}>Profile update</Text>
      </View>
    </View>
  );
}

function DoseRow({ item, onDelete, note }: { item: DoseEntry; onDelete?: () => void; note?: string }): React.JSX.Element {
  const slotLabel = item.data.slot.charAt(0).toUpperCase() + item.data.slot.slice(1);

  const handleLongPress = () => {
    Alert.alert(
      'Remove dose log?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onLongPress={handleLongPress}
      accessibilityRole="none"
      accessibilityLabel={`${item.data.supplementName} dose log. Long press to delete.`}
      accessibilityHint="Long press to remove this dose log"
    >
      <View style={[styles.iconWrap, styles.iconDose]}>
        <Text style={styles.iconText}>💊</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.data.supplementName}
          </Text>
          <View style={styles.timeRow}>
            {item.data.late && (
              <View style={styles.latePill}>
                <Text style={styles.latePillText}>Late</Text>
              </View>
            )}
            <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{slotLabel} dose logged · hold to delete</Text>
        {note ? <Text style={styles.noteText}>{note}</Text> : null}
      </View>
    </Pressable>
  );
}

function HistoryRowInner({ item, onPressChatItem, onDeleteDose, doseNotes }: Props): React.JSX.Element {
  if (item.type === 'conversation') {
    return <ConversationRow item={item} onPress={onPressChatItem} />;
  }
  if (item.type === 'cabinet_change') {
    return <CabinetRow item={item} />;
  }
  if (item.type === 'dose') {
    const logId = item.data._id;
    return (
      <DoseRow
        item={item}
        onDelete={logId && onDeleteDose ? () => onDeleteDose(logId) : undefined}
        note={logId ? doseNotes?.[logId] : undefined}
      />
    );
  }
  return <ProfileRow item={item} />;
}

export const HistoryRow = memo(HistoryRowInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.screenPad,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.screenPad,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconChat: {
    backgroundColor: colors.primaryLight,
  },
  iconCabinet: {
    backgroundColor: colors.aiLight,
  },
  iconProfile: {
    backgroundColor: colors.warningLight,
  },
  iconDose: {
    backgroundColor: '#edf8f1',
  },
  iconText: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.text,
    flex: 1,
  },
  time: {
    ...typography.caption,
    color: colors.text3,
    flexShrink: 0,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  latePill: {
    backgroundColor: colors.warningLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  latePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  preview: {
    ...typography.bodySmall,
    color: colors.text2,
  },
  meta: {
    ...typography.caption,
    color: colors.text3,
  },
  noteText: {
    ...typography.caption,
    color: colors.text2,
    fontStyle: 'italic',
  },
});
