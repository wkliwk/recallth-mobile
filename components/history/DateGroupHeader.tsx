/**
 * DateGroupHeader — caption-style sticky section label for the history timeline.
 * Groups: TODAY / YESTERDAY / THIS WEEK / <Month Year>
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ColorPalette, spacing, typography } from '../../utils/theme';
import { useThemeColors } from '../../utils/useTheme';

interface Props {
  label: string;
}

export function DateGroupHeader({ label }: Props): React.JSX.Element {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label.toUpperCase()}</Text>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: c.bg,
  },
  text: {
    ...typography.caption,
    color: c.text3,
    letterSpacing: 0.5,
  },
});}
