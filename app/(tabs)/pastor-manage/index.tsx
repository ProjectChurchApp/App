// app/(tabs)/pastor-manage/index.tsx
// 목사 전용: 연결 요청 관리 + 내 성도 목록 통합

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  AppButton,
  Avatar,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
  useTabBarOverlap,
} from '../../../components/ui/primitives';
import { Palette, Radius, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { Connection, MemberSummary } from '../../../types/connection';
import { api } from '../../../utils/api';

export default function PastorManageScreen() {
  const insets = useSafeAreaInsets();
  const tabBarOverlap = useTabBarOverlap();
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();

  const [requests, setRequests] = useState<Connection[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingID, setProcessingID] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsRes, membersRes] = await Promise.all([
        api.get<Connection[]>('/connections/pending'),
        api.get<MemberSummary[]>('/connections/my-members'),
      ]);
      setRequests(requestsRes.data);
      setMembers(membersRes.data);
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

  const handleRespond = async (item: Connection, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const ok = await confirm({
        title: `${item.memberName}님의 요청을 거절할까요?`,
        message: '거절해도 성도가 다시 요청할 수 있어요.',
        confirmLabel: '거절',
        destructive: true,
      });
      if (!ok) return;
    }

    setProcessingID(item.id);
    try {
      await api.patch(`/connections/${item.id}/${action}`);
      await fetchData();
      toast(
        action === 'approve' ? `${item.memberName}님과 연결됐어요.` : '요청을 거절했어요.',
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
        title="성도관리"
        subtitle={
          requests.length > 0
            ? `승인을 기다리는 요청 ${requests.length}건`
            : `연결된 성도 ${members.length}명`
        }
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      {isLoading ? (
        <SkeletonList count={3} />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: tabBarOverlap + Spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 연결 요청 */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>연결 요청</Text>
              {requests.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{requests.length}</Text>
                </View>
              )}
            </View>

            {requests.length === 0 ? (
              <Text style={styles.emptyText}>대기 중인 연결 요청이 없어요.</Text>
            ) : (
              <View style={styles.cards}>
                {requests.map((item) => (
                  <SurfaceCard key={item.id} style={styles.requestCard}>
                    <View style={styles.personRow}>
                      <Avatar name={item.memberName} size={44} />
                      <Text style={styles.personName}>{item.memberName}</Text>
                    </View>
                    <View style={styles.actions}>
                      <AppButton
                        label="거절"
                        variant="outlined"
                        onPress={() => handleRespond(item, 'reject')}
                        disabled={processingID === item.id}
                        style={styles.actionButton}
                      />
                      <AppButton
                        label="승인"
                        onPress={() => handleRespond(item, 'approve')}
                        loading={processingID === item.id}
                        style={styles.actionButton}
                      />
                    </View>
                  </SurfaceCard>
                ))}
              </View>
            )}
          </View>

          {/* 내 성도 */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>내 성도</Text>
              {members.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{members.length}</Text>
                </View>
              )}
            </View>

            {members.length === 0 ? (
              <Text style={styles.emptyText}>아직 연결된 성도가 없어요.</Text>
            ) : (
              <View style={styles.cards}>
                {members.map((item) => (
                  <SurfaceCard key={item.loginID} style={styles.memberCard}>
                    <Avatar name={item.name} size={40} />
                    <View style={styles.memberText}>
                      <Text style={styles.personName}>{item.name}</Text>
                      <Text style={styles.memberID}>@{item.loginID}</Text>
                    </View>
                  </SurfaceCard>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs },

  section: { marginBottom: Spacing.xxxl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: Type.titleMedium.fontSize,
    fontWeight: Type.titleMedium.fontWeight,
    letterSpacing: Type.titleMedium.letterSpacing,
    color: Palette.onSurface,
  },
  countPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
  },
  countText: {
    fontSize: Type.labelSmall.fontSize,
    fontWeight: '700',
    color: Palette.onPrimaryContainer,
  },
  emptyText: {
    fontSize: Type.bodyMedium.fontSize,
    color: Palette.onSurfaceVariant,
    paddingVertical: Spacing.lg,
  },

  cards: { gap: Spacing.md },
  requestCard: { gap: Spacing.md },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  personName: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onSurface,
    flexShrink: 1,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionButton: { flex: 1, minHeight: 44 },

  memberCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  memberText: { flexShrink: 1 },
  memberID: { fontSize: Type.labelSmall.fontSize, fontWeight: '400', color: Palette.onSurfaceVariant },
});
