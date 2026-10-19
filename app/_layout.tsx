// app/_layout.tsx

import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FeedbackProvider } from '../components/ui/Feedback';
import { AuthProvider } from '../contexts/AuthContext';

// 앱이 열려있을 때도 알림 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    // 기도 상세에서 옆으로 쓸어 넘기는 동작을 쓰려면 제스처 처리기가 앱 최상단을 감싸야 한다.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FeedbackProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </FeedbackProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}