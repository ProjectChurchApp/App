// app/(tabs)/_layout.tsx

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <IconSymbol name="house.fill" color={color} size={28} />,
        }}
      />

      {/* board 폴더 전체를 탭으로 등록 */}
      <Tabs.Screen
        name="board"
        options={{
          title: '게시판',
          tabBarIcon: ({ color }) => <IconSymbol name="list.bullet" color={color} size={28} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color }) => <IconSymbol name="person.fill" color={color} size={28} />,
        }}
      />
    </Tabs>
  );
}