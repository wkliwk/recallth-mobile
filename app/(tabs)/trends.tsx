import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../utils/theme';

export default function TrendsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>△</Text>
      <Text style={styles.title}>Trends</Text>
      <Text style={styles.sub}>Coming soon — adherence charts and insights</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 40,
    color: colors.dim,
    marginBottom: 8,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  sub: {
    ...typography.bodySmall,
    color: colors.text2,
    textAlign: 'center',
    maxWidth: 260,
  },
});
