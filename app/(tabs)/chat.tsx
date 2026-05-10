/**
 * Chat tab — placeholder screen.
 * Full implementation is tracked in a follow-up issue.
 */
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, typography } from '../../utils/theme';

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.center}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.sectionTitle, color: colors.text },
  subtitle: { ...typography.body, color: colors.text3, marginTop: 4 },
});
