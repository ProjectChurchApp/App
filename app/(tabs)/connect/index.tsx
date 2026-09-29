// app/(tabs)/connect/index.tsx
// 성도 전용: 목사님과 연결 요청

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  AppButton,
  Avatar,
  Chip,
  EmptyState,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
} from '../../../components/ui/primitives';
import { ICON_SM, Palette, Radius, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { Connection, ConnectionStatus, PastorOption } from '../../../types/connection';
import { api } from '../../../utils/api';

const STATUS_TONE: Record<ConnectionStatus, { label: string; fg: string; bg: string }> = {
  PENDING: {
    label: '승인 대기 중',
    fg: Palette.onWarningContainer,
    bg: Palette.warningContainer,
  },
  APPROVED: {
    label: '연결됨',
    fg: Palette.onSuccessContainer,
    bg: Palette.successContainer,
  },
  REJECTED: {
    label: '거절됨',
    fg: Palette.onDangerContainer,
    bg: Palette.dangerContainer,
  },
};

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useFeedback();

  const [pastors, setPastors] = useState<PastorOption[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingLoginID, setRequestingLoginID] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pastorsRes, connectionRes] = await Promise.all([
        api.get<PastorOption[]>('/connections/pastors'),
        api.get<Connection | null>('/connections/me'),
      ]);
      setPastors(pastorsRes.data);
      setConnection(connectionRes.data);
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRequest = async (pastorLoginID: string) => {
    setRequestingLoginID(pastorLoginID);
    try {
      await api.post('/connections', { pastorLoginID });
      await fetchData();
      toast('연결을 요청했어요. 목사님 승인을 기다려주세요.', 'success');
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setRequestingLoginID(null);
    }
  };

  const showPastorList = !isLoading && (!connection || connection.status === 'REJECTED');

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="목사님과 연결"
        subtitle="연결하면 기도를 함께 나눌 수 있어요"
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      {connection && (
        <View style={styles.statusCard}>
          <MaterialCommunityIcons
            name="account-heart-outline"
            size={ICON_SM}
            color={Palette.primary}
          />
          <Text style={styles.statusText}>{connection.pastorName} 목사님</Text>
          <Chip tone={STATUS_TONE[connection.status]} />
        </View>
      )}

      {isLoading ? (
        <SkeletonList count={3} />
      ) : !showPastorList ? (
        <EmptyState
          icon={connection?.status === 'APPROVED' ? 'check-circle-outline' : 'clock-outline'}
          title={
            connection?.status === 'APPROVED'
              ? '목사님과 연결되어 있어요'
              : '연결 승인을 기다리고 있어요'
          }
          description={
            connection?.status === 'APPROVED'
              ? '나의기도에서 기도를 목사님께 보낼 수 있어요.'
              : '목사님이 승인하면 알려드릴게요.'
          }
          actionLabel={connection?.status === 'APPROVED' ? '나의기도로 가기' : undefined}
          onAction={
            connection?.status === 'APPROVED'
              ? () => router.push('/(tabs)/my-prayer' as any)
              : undefined
          }
        />
      ) : pastors.length === 0 ? (
        <EmptyState
          icon="account-search-outline"
          title="연결 가능한 목사님이 없어요"
          description="목사님 계정이 관리자 승인을 받으면 이곳에 표시됩니다."
        />
      ) : (
        <FlatList
          data={pastors}
          keyExtractor={(item) => item.loginID}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xxl },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <SurfaceCard style={styles.pastorCard}>
              <View style={styles.pastorLeft}>
                <Avatar name={item.name} size={44} />
                <View style={styles.pastorText}>
                  <Text style={styles.pastorName}>{item.name} 목사님</Text>
                  <Text style={styles.pastorID}>@{item.loginID}</Text>
                </View>
              </View>
              <AppButton
                label="연결 요청"
                variant="tonal"
                onPress={() => handleRequest(item.loginID)}
                loading={requestingLoginID === item.loginID}
                style={styles.requestButton}
              />
            </SurfaceCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryContainer,
  },
  statusText: {
    flex: 1,
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onPrimaryContainer,
  },

  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs },
  separator: { height: Spacing.md },

  pastorCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  pastorLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minWidth: 0 },
  pastorText: { flexShrink: 1 },
  pastorName: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onSurface,
  },
  pastorID: { fontSize: Type.labelSmall.fontSize, fontWeight: '400', color: Palette.onSurfaceVariant },
  requestButton: { paddingHorizontal: Spacing.lg, minHeight: 42 },
});
