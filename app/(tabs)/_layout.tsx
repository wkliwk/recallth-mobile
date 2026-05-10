import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text } from 'react-native';

import { colors } from '../../utils/theme';

// ─── Icon glyphs (text-based; swap for an icon library in a follow-up) ────────

function HomeIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>⌂</Text>;
}

function CabinetIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>⬜</Text>;
}

function ChatIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>✦</Text>;
}

function ProfileIcon({ color }: { color: string }) {
  return <Text style={[styles.tabIcon, { color }]}>◯</Text>;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text3,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 10,
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
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="cabinet"
        options={{
          title: 'Cabinet',
          tabBarLabel: 'Cabinet',
          headerShown: true,
          headerTitle: 'My Cabinet',
          tabBarIcon: ({ color }) => <CabinetIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color }) => <ChatIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Health Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
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
