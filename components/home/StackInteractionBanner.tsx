import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../utils/theme';

export interface StackWarning {
  nameA: string;
  nameB: string;
  description: string;
  suppIdA: string;
  suppIdB: string;
}

interface Props {
  warning: StackWarning;
  onPress: () => void;
  onDismiss: () => void;
}

export function StackInteractionBanner({ warning, onPress, onDismiss }: Props) {
  const body = warning.description.length > 120
    ? warning.description.slice(0, 117) + '…'
    : warning.description;

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.content, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel={`Interaction: ${warning.nameA} and ${warning.nameB}. ${body}`}
      >
        <Text style={styles.icon}>⚠</Text>
        <View style={styles.text}>
          <Text style={styles.title}>
            {warning.nameA} + {warning.nameB}
          </Text>
          <Text style={styles.body} numberOfLines={3}>{body}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss interaction warning"
        style={styles.dismiss}
      >
        <Text style={styles.dismissText}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.warning + '50',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: 14,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  icon: { fontSize: 16, color: colors.warning, marginTop: 2 },
  text: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 2,
  },
  body: {
    ...typography.bodySmall,
    color: colors.text2,
    lineHeight: 18,
  },
  dismiss: { paddingLeft: spacing.sm },
  dismissText: { fontSize: 14, color: colors.text3, fontWeight: '600' },
});
