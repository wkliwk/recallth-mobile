import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../utils/theme';

const MILESTONE_CONFIG: Record<number, { emoji: string; subtitle: string }> = {
  7: { emoji: '🔥', subtitle: 'One full week of consistent care. Keep the flame alive!' },
  30: { emoji: '⭐', subtitle: 'A whole month of showing up for your health. Incredible.' },
  100: { emoji: '🏆', subtitle: '100 days strong. You\'ve built a real habit — legendary.' },
};

interface Props {
  days: number;
  onDismiss: () => void;
}

export function StreakMilestoneModal({ days, onDismiss }: Props) {
  const config = MILESTONE_CONFIG[days];
  if (!config) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{config.emoji}</Text>
          <Text style={styles.title}>{days}-day streak!</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel="Keep it up — close milestone"
          >
            <Text style={styles.btnText}>Keep it up →</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPad,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 56,
    lineHeight: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text2,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
