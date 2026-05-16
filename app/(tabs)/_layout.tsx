import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';

import { colors } from '../../utils/theme';

function SummaryIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>◉</Text>;
}

function ChatIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>◎</Text>;
}

function CabinetIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>◇</Text>;
}

function TrendsIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>△</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: {
          backgroundColor: 'rgba(245,245,240,0.92)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'Summary',
          tabBarIcon: ({ color }) => <SummaryIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color }) => <ChatIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="cabinet"
        options={{
          tabBarLabel: 'Cabinet',
          tabBarIcon: ({ color }) => <CabinetIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="trends"
        options={{
          tabBarLabel: 'Trends',
          tabBarIcon: ({ color }) => <TrendsIcon color={color} />,
        }}
      />
      {/* Hidden from tab bar — accessible via deep link */}
      <Tabs.Screen
        name="history"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="extractionReview"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
