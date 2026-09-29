// app/(tabs)/pastor-manage/index.tsx
// 목사 전용: 연결 요청 관리 + 내 성도 목록 통합

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Connection, MemberSummary } from '../../../types/connection';
import { api } from '../../../utils/api';
import { useFeedback } from '../../../components/ui/Feedback';

export default function PastorManageScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useFeedback();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();

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
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      toast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRespond = async (id: number, action: 'approve' | 'reject') => {
    setProcessingID(id);
    try {
      await api.patch(`/connections/${id}/${action}`);
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      toast(msg, 'error');
    } finally {
      setProcessingID(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: tabBarHeight }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>성도관리</Text>
          <Text style={styles.subtitle}>연결 요청 및 성도 목록</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 연결 요청 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>연결 요청 {requests.length > 0 ? `(${requests.length})` : ''}</Text>
            {requests.length === 0 ? (
              <Text style={styles.emptyText}>대기 중인 연결 요청이 없습니다.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {requests.map((item) => (
                  <View key={item.id} style={styles.requestCard}>
                    <Text style={styles.memberName}>{item.memberName}</Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton, processingID === item.id && styles.buttonDisabled]}
                        onPress={() => handleRespond(item.id, 'reject')}
                        disabled={processingID === item.id}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.rejectButtonText}>거절</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton, processingID === item.id && styles.buttonDisabled]}
                        onPress={() => handleRespond(item.id, 'approve')}
                        disabled={processingID === item.id}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.approveButtonText}>승인</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 내 성도 목록 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내 성도 {members.length > 0 ? `(${members.length})` : ''}</Text>
            {members.length === 0 ? (
              <Text style={styles.emptyText}>아직 연결된 성도가 없습니다.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {members.map((item) => (
                  <View key={item.loginID} style={styles.memberCard}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberLoginID}>@{item.loginID}</Text>
                  </View>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  headerTitleGroup: { flexShrink: 1 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000000' },
  subtitle: { fontSize: 13, color: '#999999', marginTop: 2 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 28 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000000' },
  emptyText: { fontSize: 14, color: '#999999' },

  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  memberName: { fontSize: 15, fontWeight: '600', color: '#000000' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  approveButton: { backgroundColor: '#000000' },
  approveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  rejectButton: { backgroundColor: '#F0F0F0' },
  rejectButtonText: { color: '#666666', fontSize: 13, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  memberLoginID: { fontSize: 13, color: '#999999' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
