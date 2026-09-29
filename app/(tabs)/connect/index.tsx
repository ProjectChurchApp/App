// app/(tabs)/connect/index.tsx
// 성도 전용: 목사님과 연결 요청

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { Connection, ConnectionStatus, PastorOption } from '../../../types/connection';
import { api } from '../../../utils/api';
import { useFeedback } from '../../../components/ui/Feedback';

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  PENDING: '승인 대기 중',
  APPROVED: '연결됨',
  REJECTED: '거절됨',
};

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const { toast } = useFeedback();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();

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

  const handleRequest = async (pastorLoginID: string) => {
    setRequestingLoginID(pastorLoginID);
    try {
      await api.post('/connections', { pastorLoginID });
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      toast(msg, 'error');
    } finally {
      setRequestingLoginID(null);
    }
  };

  const showPastorList = !isLoading && (!connection || connection.status === 'REJECTED');

  return (
    <View style={[styles.container, { paddingBottom: tabBarHeight }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>목사님과 연결</Text>
          <Text style={styles.subtitle}>연결하면 기도 공유가 가능해요</Text>
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

      {connection && (
        <View style={styles.statusCard}>
          <Text style={styles.statusCardText}>
            {connection.pastorName} 목사님 — {STATUS_LABELS[connection.status]}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : !showPastorList ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            {connection?.status === 'APPROVED'
              ? '이미 목사님과 연결되어 있어요.'
              : '연결 승인을 기다리고 있어요.'}
          </Text>
        </View>
      ) : pastors.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>연결 가능한 목사님이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={pastors}
          keyExtractor={(item) => item.loginID}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.pastorCard}>
              <Text style={styles.pastorName}>{item.name} 목사님</Text>
              <TouchableOpacity
                style={[styles.requestButton, requestingLoginID === item.loginID && styles.buttonDisabled]}
                onPress={() => handleRequest(item.loginID)}
                disabled={requestingLoginID === item.loginID}
                activeOpacity={0.8}
              >
                <Text style={styles.requestButtonText}>
                  {requestingLoginID === item.loginID ? '요청 중...' : '연결 요청'}
                </Text>
              </TouchableOpacity>
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
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF3E0',
  },
  statusCardText: { fontSize: 14, fontWeight: '600', color: '#B8752E' },
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  separator: { height: 10 },
  pastorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  pastorName: { fontSize: 15, fontWeight: '600', color: '#000000' },
  requestButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  requestButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#999999', textAlign: 'center', paddingHorizontal: 20 },
});
