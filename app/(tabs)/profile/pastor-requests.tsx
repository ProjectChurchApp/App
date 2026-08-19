// app/(tabs)/profile/pastor-requests.tsx

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Connection } from '../../../types/connection';
import { api } from '../../../utils/api';

export default function PastorRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [requests, setRequests] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingID, setProcessingID] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<Connection[]>('/connections/pending');
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

  const handleRespond = async (id: number, action: 'approve' | 'reject') => {
    setProcessingID(id);
    try {
      await api.patch(`/connections/${id}/${action}`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setProcessingID(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>연결 요청 관리</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>대기 중인 연결 요청이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
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
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  backButtonText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
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
  memberName: { fontSize: 15, fontWeight: '600', color: '#000000' },
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
