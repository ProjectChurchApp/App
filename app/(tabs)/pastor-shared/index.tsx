// app/(tabs)/pastor-shared/index.tsx
// 목사 전용: 성도들이 나에게 공유한 기도 요청 목록 + 바로 중보기도로 승격

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { PrayerItem } from '../../../types/prayer';
import { api } from '../../../utils/api';

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function PastorSharedScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();

  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [promotingID, setPromotingID] = useState<number | null>(null);

  const fetchPrayers = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await api.get<PrayerItem[]>('/prayer');
      setPrayers(res.data.filter((p) => p.boardStage === 'SHARED_WITH_PASTOR'));
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPrayers();
    }, [fetchPrayers])
  );

  const handlePromote = (id: number) => {
    const doPromote = async () => {
      setPromotingID(id);
      try {
        await api.post(`/prayer/${id}/promote`);
        setPrayers((prev) => prev.filter((p) => p.id !== id));
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
    <View style={[styles.container, { paddingBottom: tabBarHeight }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>성도기도요청</Text>
          <Text style={styles.subtitle}>나에게 공유된 기도 요청</Text>
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
      ) : prayers.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>공유된 기도 요청이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={prayers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => fetchPrayers(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({
                pathname: '/(tabs)/pastor-shared/[id]',
                params: { id: item.id }
              } as any)}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardDate}>{formatDate(item.createdDate)}</Text>
              </View>
              <Text style={styles.cardContents} numberOfLines={2}>{item.contents}</Text>
              <Text style={styles.cardWriter}>{item.writerName}</Text>

              <TouchableOpacity
                style={[styles.promoteButton, promotingID === item.id && styles.buttonDisabled]}
                onPress={() => handlePromote(item.id)}
                disabled={promotingID === item.id}
                activeOpacity={0.8}
              >
                <Text style={styles.promoteButtonText}>
                  {promotingID === item.id ? '공유 중...' : '🙏 중보기도로 공유'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
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
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#000000' },
  cardDate: { fontSize: 12, color: '#999999', flexShrink: 0 },
  cardContents: { fontSize: 14, color: '#444444', lineHeight: 20 },
  cardWriter: { fontSize: 12, color: '#999999' },

  promoteButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
  },
  promoteButtonText: { fontSize: 13, fontWeight: '700', color: '#B8752E' },
  buttonDisabled: { opacity: 0.5 },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#999999' },
});
