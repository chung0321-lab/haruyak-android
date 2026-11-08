import React from 'react';
import { Platform, useWindowDimensions, type ColorValue } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Feather>['name'];

export default function TabLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  // Some One UI navigation modes report a small/zero inset during startup.
  // Keep a minimum Android buffer, then reserve additional space for labels.
  const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 24) + 12 : Math.max(insets.bottom, 12);
  const menuHeight = 72 + Math.ceil(20 * Math.max(0, fontScale - 1));
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
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 20, includeFontPadding: true },
        tabBarActiveBackgroundColor: c.secondary,
        tabBarItemStyle: { borderRadius: 16, marginHorizontal: 4, paddingVertical: 6 },
        tabBarStyle: {
          // Normal layout reserves screen space; content cannot slip underneath.
          backgroundColor: c.white,
          borderTopWidth: 1,
          borderTopColor: c.border,
          elevation: 0,
          paddingHorizontal: 8,
          height: menuHeight + bottomInset,
          paddingTop: 6,
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
