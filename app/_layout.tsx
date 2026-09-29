// app/_layout.tsx

import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
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
    <AuthProvider>
      <FeedbackProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </FeedbackProvider>
    </AuthProvider>
  );
}