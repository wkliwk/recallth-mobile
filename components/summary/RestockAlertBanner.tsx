import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPalette, radius, spacing } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  names: string[];
  onPress: () => void;
}

function formatNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} is running low`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are running low`;
  return `${names[0]} and ${names.length - 1} others are running low`;
}

export function RestockAlertBanner({ names, onPress }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (names.length === 0) return null;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.banner, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`${formatNames(names)} — tap to restock in Cabinet`}
    >
      <View style={styles.left}>
        <Text style={styles.icon}>📦</Text>
        <View>
          <Text style={styles.title}>{formatNames(names)}</Text>
          <Text style={styles.subtitle}>Tap to restock in Cabinet</Text>
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
      backgroundColor: c.warningMid,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.warning + '40',
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
