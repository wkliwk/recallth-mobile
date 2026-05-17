import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ColorPalette, radius, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  onAdd: () => void;
}

export function FirstRunNudge({ onAdd }: Props) {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name="flask-outline" size={36} color={c.primary} />
      </View>
      <Text style={styles.headline}>Your supplement cabinet is empty</Text>
      <Text style={styles.copy}>
        Add your first supplement to start tracking doses, spot conflicts, and get AI suggestions personalised to your stack.
      </Text>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Add your first supplement"
      >
        <Text style={styles.btnText}>+ Add Supplement</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: spacing.xxxl,
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxl,
    },
    iconWrap: {
      width: 80,
      height: 80,
      borderRadius: radius.xl,
      backgroundColor: c.primaryLight,
      borderWidth: 1.5,
      borderColor: c.primary + '40',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    headline: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
      letterSpacing: -0.3,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    copy: {
      ...typography.body,
      color: c.text2,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
    },
    btn: {
      backgroundColor: c.primary,
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
}
