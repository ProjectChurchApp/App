// app/(tabs)/prayer/index.tsx

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';

// ─── 타입 ───────────────────────────────────────────────
interface PrayerItem {
  id: number;
  title: string;
  contents: string;
  writerName: string;
  writerLoginID: string;
  visibility: 'PRIVATE' | 'PASTOR';
  createdDate: string;
}

// ─── 상수 ───────────────────────────────────────────────
const PAGE_SIZE = 10;

// ─── 날짜 포맷 ───────────────────────────────────────────
function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

// ─── 카드 컴포넌트 ───────────────────────────────────────
function PrayerCard({ item, onPress }: {
  item: PrayerItem;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardDate}>{formatDate(item.createdDate)}</Text>
      </View>
      <Text style={styles.cardContents} numberOfLines={2}>{item.contents}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.cardWriter}>{item.writerName}</Text>
        <View style={[
          styles.visibilityBadge,
          item.visibility === 'PRIVATE' ? styles.badgePrivate : styles.badgePastor
        ]}>
          <Text style={styles.visibilityText}>
            {item.visibility === 'PRIVATE' ? '🔒 나만보기' : '🙏 목사님께'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────
export default function PrayerScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [allPrayers, setAllPrayers] = useState<PrayerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── 검색 ──────────────────────────────────────────────
  const [searchType, setSearchType] = useState<'title' | 'writer'>('title');
  const [searchKeyword, setSearchKeyword] = useState('');

  // ── 페이지네이션 ───────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── 필터링된 데이터 ───────────────────────────────────
  const filteredPrayers = (() => {
    let data = allPrayers;

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      if (searchType === 'title') {
        data = data.filter((p) => p.title.toLowerCase().includes(keyword));
      } else {
        data = data.filter((p) => p.writerName.toLowerCase().includes(keyword));
      }
    }

    return data;
  })();

  const totalPages = Math.max(1, Math.ceil(filteredPrayers.length / PAGE_SIZE));
  const pagedPrayers = filteredPrayers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ── 데이터 불러오기 ────────────────────────────────────
  const fetchPrayers = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await api.get<PrayerItem[]>('/prayer');
      setAllPrayers(res.data);
      setCurrentPage(1);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 화면 포커스 시 자동 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchPrayers();
    }, [fetchPrayers])
  );

  // 검색어/타입 바뀌면 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, searchType]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.title}>기도 요청</Text>
          <Text style={styles.subtitle}>간절한 마음을 전해보세요</Text>
        </View>
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => router.push('/(tabs)/prayer/write' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.writeButtonText}>+ 작성</Text>
        </TouchableOpacity>
      </View>

      {/* 검색 바 */}
      <View style={styles.searchRow}>
        <TouchableOpacity
          style={styles.searchTypeButton}
          onPress={() => setSearchType(searchType === 'title' ? 'writer' : 'title')}
          activeOpacity={0.8}
        >
          <Text style={styles.searchTypeText}>
            {searchType === 'title' ? '제목' : '작성자'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.searchInput}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholder={searchType === 'title' ? '제목으로 검색' : '작성자로 검색'}
          placeholderTextColor="#AAAAAA"
          returnKeyType="search"
        />

        {searchKeyword.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchKeyword('')}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 검색 결과 수 */}
      {searchKeyword.trim() && (
        <Text style={styles.resultCount}>{filteredPrayers.length}개의 결과</Text>
      )}

      {/* 목록 */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : pagedPrayers.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            {searchKeyword.trim() ? '검색 결과가 없습니다.' : '기도 요청이 없습니다.'}
          </Text>
          {!searchKeyword.trim() && (
            <Text style={styles.emptySubText}>첫 번째 기도 요청을 작성해보세요 🙏</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={pagedPrayers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PrayerCard
              item={item}
              onPress={() => router.push({
                pathname: '/(tabs)/prayer/[id]',
                params: { id: item.id }
              })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => fetchPrayers(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={() => (
            <View style={styles.pagination}>
              {/* 이전 */}
              <TouchableOpacity
                style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                activeOpacity={0.7}
              >
                <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
                  ‹
                </Text>
              </TouchableOpacity>

              {/* 페이지 번호 */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <Text key={`ellipsis-${idx}`} style={styles.ellipsis}>…</Text>
                  ) : (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pageButton, currentPage === p && styles.pageButtonActive]}
                      onPress={() => setCurrentPage(p as number)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pageButtonText, currentPage === p && styles.pageButtonTextActive]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  )
                )}

              {/* 다음 */}
              <TouchableOpacity
                style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                activeOpacity={0.7}
              >
                <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>
                  ›
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── 스타일 ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000000' },
  subtitle: { fontSize: 13, color: '#999999', marginTop: 2 },
  writeButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  writeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  // 검색
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  searchTypeButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  searchTypeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  searchInput: { flex: 1, fontSize: 14, color: '#000000', paddingVertical: 2 },
  clearButton: { padding: 4 },
  clearButtonText: { fontSize: 13, color: '#999999' },
  resultCount: {
    fontSize: 12,
    color: '#999999',
    paddingHorizontal: 20,
    marginBottom: 6,
  },

  // 목록
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
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
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardWriter: { fontSize: 12, color: '#999999' },
  visibilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgePrivate: { backgroundColor: '#F0F0F0' },
  badgePastor: { backgroundColor: '#FFF3E0' },
  visibilityText: { fontSize: 11, fontWeight: '600', color: '#666666' },

  // 페이지네이션
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },
  pageButtonActive: { backgroundColor: '#000000' },
  pageButtonDisabled: { opacity: 0.3 },
  pageButtonText: { fontSize: 15, color: '#333333', fontWeight: '600' },
  pageButtonTextActive: { color: '#FFFFFF' },
  pageButtonTextDisabled: { color: '#999999' },
  ellipsis: { fontSize: 15, color: '#999999', paddingHorizontal: 4 },

  // 공통
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, color: '#999999' },
  emptySubText: { fontSize: 13, color: '#BBBBBB' },
});