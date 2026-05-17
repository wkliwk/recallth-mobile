import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  count: number;
  onPress: () => void;
}

export function InteractionWarningBanner({ count, onPress }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`${count} interaction warning${count === 1 ? '' : 's'} in your cabinet — tap to review`}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>⚠</Text>
        <View>
          <Text style={styles.title}>
            {count} interaction warning{count === 1 ? '' : 's'} in your cabinet
          </Text>
          <Text style={styles.subtitle}>Tap to review in Cabinet</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.warningLight,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.warning + '50',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: 14,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    icon: {
      fontSize: 18,
      color: c.warning,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: c.warning,
      lineHeight: 19,
    },
    subtitle: {
      fontSize: 12,
      color: c.warning,
      opacity: 0.75,
      marginTop: 1,
    },
    chevron: {
      fontSize: 20,
      color: c.warning,
      fontWeight: '300',
      marginLeft: spacing.sm,
    },
  });
}
