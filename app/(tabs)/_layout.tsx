import { Tabs } from 'expo-router';

import { colors } from '../../utils/theme';

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
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recallth',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="cabinet"
        options={{
          title: 'Cabinet',
          tabBarLabel: 'Cabinet',
          headerShown: true,
          headerTitle: 'My Cabinet',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarLabel: 'Chat',
          // AI purple active tint for the Chat tab per design spec
          tabBarActiveTintColor: colors.ai,
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
        }}
      />
    </Tabs>
  );
}
