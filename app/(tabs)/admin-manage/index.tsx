// app/(tabs)/admin-manage/index.tsx
// 관리자 전용: 목사 가입 승인 관리

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { PastorRequest } from '../../../types/user';
import { api } from '../../../utils/api';

export default function AdminManageScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();

  const [requests, setRequests] = useState<PastorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingID, setProcessingID] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<PastorRequest[]>('/admin/pastor-requests');
      setRequests(res.data);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleRespond = async (userId: number, action: 'approve' | 'reject') => {
    setProcessingID(userId);
    try {
      await api.post(`/admin/pastor-requests/${userId}/${action}`);
      setRequests((prev) => prev.filter((r) => r.userId !== userId));
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setProcessingID(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: tabBarHeight }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>승인 관리</Text>
          <Text style={styles.subtitle}>목사 가입 승인</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>승인 대기 중인 목사 신청이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={fetchData}
          refreshing={isLoading}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View>
                <Text style={styles.pastorName}>{item.name} 목사</Text>
                <Text style={styles.pastorLoginID}>@{item.loginID}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton, processingID === item.userId && styles.buttonDisabled]}
                  onPress={() => handleRespond(item.userId, 'reject')}
                  disabled={processingID === item.userId}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rejectButtonText}>거절</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton, processingID === item.userId && styles.buttonDisabled]}
                  onPress={() => handleRespond(item.userId, 'approve')}
                  disabled={processingID === item.userId}
                  activeOpacity={0.8}
                >
                  <Text style={styles.approveButtonText}>승인</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
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

  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  separator: { height: 10 },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  pastorName: { fontSize: 15, fontWeight: '600', color: '#000000' },
  pastorLoginID: { fontSize: 12, color: '#999999', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveButton: { backgroundColor: '#000000' },
  approveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  rejectButton: { backgroundColor: '#F0F0F0' },
  rejectButtonText: { color: '#666666', fontSize: 13, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#999999' },
});
