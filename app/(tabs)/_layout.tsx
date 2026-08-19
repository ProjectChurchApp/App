// app/(tabs)/_layout.tsx

import { IconSymbol } from '@/components/ui/icon-symbol';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  const isPastor = user?.role === '목사' && user?.accountStatus === 'ACTIVE';
  const isAdmin = user?.role === '관리자';

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
        name="board"
        options={{
          title: '게시판',
          tabBarIcon: ({ color }) => <IconSymbol name="list.bullet" color={color} size={28} />,
        }}
      />

      <Tabs.Screen
        name="my-prayer"
        options={{
          href: isPastor ? null : undefined,
          title: '나의기도',
          tabBarIcon: ({ color }) => <FontAwesome5 name="praying-hands" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="pastor-shared"
        options={{
          href: isPastor ? undefined : null,
          title: '성도기도요청',
          tabBarIcon: ({ color }) => <FontAwesome5 name="inbox" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="intercessory"
        options={{
          title: '중보기도',
          tabBarIcon: ({ color }) => <FontAwesome5 name="hands-helping" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="pastor-manage"
        options={{
          href: isPastor ? undefined : null,
          title: '성도관리',
          tabBarIcon: ({ color }) => <FontAwesome5 name="users-cog" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="admin-manage"
        options={{
          href: isAdmin ? undefined : null,
          title: '승인 관리',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-check" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
