// app/(tabs)/admin-manage/index.tsx
// 관리자 전용: 목사 가입 승인 관리

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  AppButton,
  Avatar,
  EmptyState,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
  useTabBarOverlap,
} from '../../../components/ui/primitives';
import { Palette, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { PastorRequest } from '../../../types/user';
import { api } from '../../../utils/api';
import { formatDate } from '../../../utils/date';

export default function AdminManageScreen() {
  const insets = useSafeAreaInsets();
  const tabBarOverlap = useTabBarOverlap();
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();

  const [requests, setRequests] = useState<PastorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingID, setProcessingID] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PastorRequest[]>('/admin/pastor-requests');
      setRequests(res.data);
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

  const handleRespond = async (item: PastorRequest, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const ok = await confirm({
        title: `${item.name}님의 목사 신청을 거절할까요?`,
        message: '거절하면 해당 계정은 목사 권한을 받지 못합니다.',
        confirmLabel: '거절',
        destructive: true,
      });
      if (!ok) return;
    }

    setProcessingID(item.userId);
    try {
      await api.post(`/admin/pastor-requests/${item.userId}/${action}`);
      setRequests((prev) => prev.filter((r) => r.userId !== item.userId));
      toast(
        action === 'approve' ? `${item.name}님을 목사님으로 승인했어요.` : '신청을 거절했어요.',
        action === 'approve' ? 'success' : 'info'
      );
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setProcessingID(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="승인 관리"
        subtitle={
          requests.length > 0
            ? `승인을 기다리는 신청 ${requests.length}건`
            : '목사 가입 승인'
        }
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon="check-circle-outline"
          title="처리할 신청이 없어요"
          description="목사님이 가입 신청하면 이곳에서 승인할 수 있어요."
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarOverlap + Spacing.xxl },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchData}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <SurfaceCard style={styles.card}>
              <View style={styles.personRow}>
                <Avatar name={item.name} size={44} />
                <View style={styles.personText}>
                  <Text style={styles.personName}>{item.name}</Text>
                  <Text style={styles.personMeta}>
                    @{item.loginID} · {formatDate(item.requestedAt)} 신청
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <AppButton
                  label="거절"
                  variant="outlined"
                  onPress={() => handleRespond(item, 'reject')}
                  disabled={processingID === item.userId}
                  style={styles.actionButton}
                />
                <AppButton
                  label="승인"
                  onPress={() => handleRespond(item, 'approve')}
                  loading={processingID === item.userId}
                  style={styles.actionButton}
                />
              </View>
            </SurfaceCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs },
  separator: { height: Spacing.md },

  card: { gap: Spacing.md },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  personText: { flexShrink: 1 },
  personName: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onSurface,
  },
  personMeta: {
    fontSize: Type.labelSmall.fontSize,
    fontWeight: '400',
    color: Palette.onSurfaceVariant,
    marginTop: 1,
  },

  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1, minHeight: 44 },
});
