/**
 * DateGroupHeader — caption-style sticky section label for the history timeline.
 * Groups: TODAY / YESTERDAY / THIS WEEK / <Month Year>
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../utils/theme';

interface Props {
  label: string;
}

export function DateGroupHeader({ label }: Props): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  text: {
    ...typography.caption,
    color: colors.text3,
    letterSpacing: 0.5,
  },
});
