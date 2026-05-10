import { Tabs } from 'expo-router';

import { colors } from '../../utils/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text3,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recallth',
          tabBarLabel: 'Home',
        }}
      />
    </Tabs>
  );
}
