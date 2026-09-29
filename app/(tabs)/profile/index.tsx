// app/(tabs)/profile/index.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFeedback } from '../../../components/ui/Feedback';
import { AppButton, Avatar, Chip, Divider, IconButton } from '../../../components/ui/primitives';
import { ICON_SM, Palette, Radius, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { confirm } = useFeedback();

  const handleLogout = async () => {
    const ok = await confirm({
      title: '로그아웃할까요?',
      message: '다시 이용하려면 아이디와 비밀번호를 입력해야 해요.',
      confirmLabel: '로그아웃',
      destructive: true,
    });
    if (ok) await logout();
  };

  if (!user) {
    // 로그아웃 직후 로그인 화면으로 넘어가기 전 짧은 순간에만 보인다.
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  const isPendingPastor =
    user.role === '목사' && user.accountStatus === 'PENDING_PASTOR_APPROVAL';

  return (
    <View style={styles.container}>
      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.xs }]}>
        <IconButton
          icon="arrow-left"
          label="뒤로"
          onPress={() => router.back()}
          tone={Palette.onSurface}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <Avatar name={user.name} size={88} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.loginID}>@{user.loginID}</Text>

          <View style={styles.badges}>
            <Chip
              tone={{
                label: user.role,
                fg: Palette.onPrimaryContainer,
                bg: Palette.primaryContainer,
              }}
            />
            {isPendingPastor && (
              <Chip
                tone={{
                  label: '관리자 승인 대기 중',
                  fg: Palette.onWarningContainer,
                  bg: Palette.warningContainer,
                }}
              />
            )}
          </View>
        </View>

        {isPendingPastor && (
          <View style={styles.notice}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={ICON_SM}
              color={Palette.onWarningContainer}
            />
            <Text style={styles.noticeText}>
              관리자가 목사님 권한을 승인하면 성도 관리와 중보기도 기능을 쓸 수 있어요.
            </Text>
          </View>
        )}

        <Divider style={styles.hr} />

        <View style={styles.rows}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>아이디</Text>
            <Text style={styles.rowValue}>{user.loginID}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>역할</Text>
            <Text style={styles.rowValue}>{user.role}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>계정 상태</Text>
            <Text style={styles.rowValue}>
              {user.accountStatus === 'ACTIVE' ? '사용 중' : '승인 대기'}
            </Text>
          </View>
        </View>

        <View style={styles.logoutWrap}>
          <AppButton
            label="로그아웃"
            icon="logout"
            variant="outlined"
            fullWidth
            onPress={handleLogout}
            loading={isLoading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  centerBox: { alignItems: 'center', justifyContent: 'center' },

  appBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.sm },

  identity: { alignItems: 'center', gap: Spacing.xs },
  name: {
    fontSize: Type.headlineSmall.fontSize,
    fontWeight: Type.headlineSmall.fontWeight,
    letterSpacing: Type.headlineSmall.letterSpacing,
    color: Palette.onSurface,
    marginTop: Spacing.md,
  },
  loginID: { fontSize: Type.bodyMedium.fontSize, color: Palette.onSurfaceVariant },
  badges: { flexDirection: 'row', gap: Spacing.xs, marginTop: Spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Palette.warningContainer,
  },
  noticeText: {
    flex: 1,
    fontSize: Type.bodySmall.fontSize,
    lineHeight: 20,
    color: Palette.onWarningContainer,
  },

  hr: { marginVertical: Spacing.xxl },

  rows: { gap: Spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  rowLabel: { fontSize: Type.bodyMedium.fontSize, color: Palette.onSurfaceVariant },
  rowValue: {
    fontSize: Type.bodyMedium.fontSize,
    fontWeight: '600',
    color: Palette.onSurface,
    flexShrink: 1,
    textAlign: 'right',
  },

  logoutWrap: { marginTop: Spacing.xxxl },
});
