import React from 'react';
import { type ColorValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Feather>['name'];

export default function TabLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  // Reserve 60dp for the menu, separately from Android's gesture/3-button area.
  const bottomInset = Math.max(insets.bottom, 8);
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
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 16, marginBottom: 2 },
        tabBarActiveBackgroundColor: c.secondary,
        tabBarItemStyle: { borderRadius: 14, marginHorizontal: 3, paddingVertical: 4 },
        tabBarStyle: {
          // Normal layout reserves screen space; content cannot slip underneath.
          backgroundColor: c.white,
          borderTopWidth: 1,
          borderTopColor: c.border,
          elevation: 0,
          paddingHorizontal: 8,
          height: 60 + bottomInset,
          paddingTop: 4,
          paddingBottom: bottomInset,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '오늘', tabBarIcon: icon('sun') }} />
      <Tabs.Screen name="meds" options={{ title: '내 약', tabBarIcon: icon('plus-square') }} />
      <Tabs.Screen name="history" options={{ title: '기록', tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
