// app/(tabs)/profile/connect.tsx

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Connection, ConnectionStatus, PastorOption } from '../../../types/connection';
import { api } from '../../../utils/api';

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  PENDING: '승인 대기 중',
  APPROVED: '연결됨',
  REJECTED: '거절됨',
};

export default function ConnectScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();

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

  const handleRequest = async (pastorLoginID: string) => {
    setRequestingLoginID(pastorLoginID);
    try {
      await api.post('/connections', { pastorLoginID });
      await fetchData();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setRequestingLoginID(null);
    }
  };

  const showPastorList = !isLoading && (!connection || connection.status === 'REJECTED');

  return (
    <View style={[styles.container, { paddingBottom: tabBarHeight }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>목사님과 연결</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  backButtonText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
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
