// app/(tabs)/_layout.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette } from '../../constants/design';
import { useAuth } from '../../contexts/AuthContext';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** 탭 아이콘. 선택된 탭만 채워진 모양으로 바뀌어 지금 어디인지 분명해진다. */
function tabIcon(outline: IconName, filled: IconName) {
  const TabBarIcon = ({ color, focused }: { color: string; focused: boolean }) => (
    <MaterialCommunityIcons name={focused ? filled : outline} size={25} color={color} />
  );
  TabBarIcon.displayName = `TabBarIcon(${outline})`;
  return TabBarIcon;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isPastor = user?.role === '목사' && user?.accountStatus === 'ACTIVE';
  const isAdmin = user?.role === '관리자';
  const isMember = user?.role === '성도';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.onSurfaceVariant,
        headerShown: false,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
        tabBarStyle: Platform.select({
          ios: { position: 'absolute', borderTopColor: Palette.outlineVariant },
          default: {
            borderTopColor: Palette.outlineVariant,
            // 제스처 바에 라벨이 붙지 않도록 안전영역만큼 띄운다
            height: 62 + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom + 10,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="board"
        options={{
          title: '게시판',
          tabBarIcon: tabIcon('bullhorn-outline', 'bullhorn'),
        }}
      />

      <Tabs.Screen
        name="my-prayer"
        options={{
          // 관리자는 개인 기도를 쓰지 않는다 (교회 요청)
          href: isPastor || isAdmin ? null : undefined,
          title: '나의기도',
          tabBarIcon: tabIcon('hands-pray', 'hands-pray'),
        }}
      />

      <Tabs.Screen
        name="pastor-shared"
        options={{
          href: isPastor ? undefined : null,
          title: '성도기도요청',
          tabBarIcon: tabIcon('inbox-arrow-down-outline', 'inbox-arrow-down'),
        }}
      />

      <Tabs.Screen
        name="intercessory"
        options={{
          title: '중보기도',
          tabBarIcon: tabIcon('hand-heart-outline', 'hand-heart'),
        }}
      />

      <Tabs.Screen
        name="connect"
        options={{
          href: isMember ? undefined : null,
          title: '목사님과 연결',
          tabBarIcon: tabIcon('link-variant', 'link-variant'),
        }}
      />

      <Tabs.Screen
        name="pastor-manage"
        options={{
          href: isPastor ? undefined : null,
          title: '성도관리',
          tabBarIcon: tabIcon('account-group-outline', 'account-group'),
        }}
      />

      <Tabs.Screen
        name="admin-manage"
        options={{
          href: isAdmin ? undefined : null,
          title: '승인 관리',
          tabBarIcon: tabIcon('account-check-outline', 'account-check'),
        }}
      />

      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
