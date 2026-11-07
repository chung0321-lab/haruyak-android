import React from 'react';
import { Platform, type ColorValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof Feather>['name'];

export default function TabLayout() {
  const c = useColors();
  const isWeb = Platform.OS === 'web';
  const icon = (name: IconName) =>
    function TabIcon({ color }: { color: ColorValue }) {
      return <Feather name={name} size={20} color={color as string} />;
    };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
        tabBarActiveBackgroundColor: c.secondary,
        tabBarItemStyle: { borderRadius: 16, marginHorizontal: 4, marginVertical: 5 },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: c.white,
          borderTopWidth: 1,
          borderTopColor: c.border,
          elevation: 0,
          paddingHorizontal: 8,
          ...(isWeb ? { height: 84 } : {}),
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '오늘', tabBarIcon: icon('sun') }} />
      <Tabs.Screen name="meds" options={{ title: '내 약', tabBarIcon: icon('plus-square') }} />
      <Tabs.Screen name="history" options={{ title: '기록', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="settings" options={{ title: '위젯·백업', tabBarIcon: icon('layers') }} />
    </Tabs>
  );
}
