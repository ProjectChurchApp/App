// app/(tabs)/profile/pastor-dashboard.tsx

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Connection } from '../../../types/connection';
import { PrayerItem } from '../../../types/prayer';
import { api } from '../../../utils/api';

export default function PastorDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [sharedPrayers, setSharedPrayers] = useState<PrayerItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [promotingID, setPromotingID] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prayersRes, pendingRes] = await Promise.all([
        api.get<PrayerItem[]>('/prayer'),
        api.get<Connection[]>('/connections/pending'),
      ]);
      setSharedPrayers(prayersRes.data.filter((p) => p.boardStage === 'SHARED_WITH_PASTOR'));
      setPendingCount(pendingRes.data.length);
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

  const handlePromote = (id: number) => {
    const doPromote = async () => {
      setPromotingID(id);
      try {
        await api.post(`/prayer/${id}/promote`);
        setSharedPrayers((prev) => prev.filter((p) => p.id !== id));
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
      } finally {
        setPromotingID(null);
      }
    };

    const message = '이 기도를 중보기도 게시판에 공유하시겠습니까? 모든 성도에게 공개됩니다.';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) doPromote();
    } else {
      Alert.alert('중보기도로 공유', message, [
        { text: '취소', style: 'cancel' },
        { text: '공유', onPress: doPromote },
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>목사 관리</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 바로가기 */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/(tabs)/profile/pastor-requests' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickCardValue}>{pendingCount}</Text>
            <Text style={styles.quickCardLabel}>연결 요청</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/(tabs)/profile/my-members' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickCardValue}>👥</Text>
            <Text style={styles.quickCardLabel}>내 성도 목록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/(tabs)/board/write' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickCardValue}>✉️</Text>
            <Text style={styles.quickCardLabel}>공지 작성</Text>
          </TouchableOpacity>
        </View>

        {/* 나에게 공유된 기도 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>나에게 공유된 기도</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/prayer' as any)} activeOpacity={0.7}>
              <Text style={styles.sectionLink}>중보기도 게시판 ›</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color="#000000" style={styles.loadingSpacer} />
          ) : sharedPrayers.length === 0 ? (
            <Text style={styles.emptyText}>공유된 기도 요청이 없습니다.</Text>
          ) : (
            sharedPrayers.map((item) => (
              <View key={item.id} style={styles.prayerCard}>
                <TouchableOpacity
                  style={styles.prayerCardMain}
                  onPress={() => router.push(`/(tabs)/prayer/${item.id}` as any)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.prayerTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.prayerWriter}>{item.writerName}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.promoteButton, promotingID === item.id && styles.buttonDisabled]}
                  onPress={() => handlePromote(item.id)}
                  disabled={promotingID === item.id}
                  activeOpacity={0.8}
                >
                  <Text style={styles.promoteButtonText}>
                    {promotingID === item.id ? '공유 중...' : '중보기도로'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  backButtonText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 24 },

  quickRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 16,
  },
  quickCardValue: { fontSize: 20, fontWeight: '700', color: '#000000' },
  quickCardLabel: { fontSize: 12, color: '#666666', fontWeight: '600' },

  section: { gap: 10 },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000000' },
  sectionLink: { fontSize: 12, color: '#999999', fontWeight: '600' },
  loadingSpacer: { marginTop: 12 },
  emptyText: { fontSize: 14, color: '#999999' },

  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  prayerCardMain: { flex: 1, gap: 2 },
  prayerTitle: { fontSize: 14, fontWeight: '600', color: '#000000' },
  prayerWriter: { fontSize: 12, color: '#999999' },
  promoteButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoteButtonText: { fontSize: 12, fontWeight: '700', color: '#B8752E' },
  buttonDisabled: { opacity: 0.5 },
});
