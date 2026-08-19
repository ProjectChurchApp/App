// app/(tabs)/profile/my-members.tsx

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MemberSummary } from '../../../types/connection';
import { api } from '../../../utils/api';

export default function MyMembersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<MemberSummary[]>('/connections/my-members');
      setMembers(res.data);
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

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>내 성도 목록</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : members.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>아직 연결된 성도가 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.loginID}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.memberCard}>
              <Text style={styles.memberName}>{item.name}</Text>
              <Text style={styles.memberLoginID}>@{item.loginID}</Text>
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  memberName: { fontSize: 15, fontWeight: '600', color: '#000000' },
  memberLoginID: { fontSize: 13, color: '#999999' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#999999' },
});
