import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0a7ea4',
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
