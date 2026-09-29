// app/(tabs)/board/index.tsx
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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
import { formatDate } from '../../../utils/date';

// ─── 타입 ───────────────────────────────────────────────
interface BoardItem {
  id: number;
  title: string;
  contents: string;
  writerName: string;
  status: 'READ' | 'UNREAD';
  createdDate: string;
}

// ─── 상수 ───────────────────────────────────────────────
const PAGE_SIZE = 10;

// ─── 목록 아이템 컴포넌트 ────────────────────────────────
function BoardCard({ item, onPress }: { item: BoardItem; onPress: () => void }) {
  const isUnread = item.status === 'UNREAD';

  return (
    <TouchableOpacity
      style={[styles.card, isUnread && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          {isUnread && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(item.createdDate)}</Text>
      </View>

      <Text style={styles.cardContents} numberOfLines={2}>
        {item.contents}
      </Text>

      <Text style={styles.cardWriter}>{item.writerName}</Text>
    </TouchableOpacity>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────
export default function BoardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();

  const [allBoards, setAllBoards] = useState<BoardItem[]>([]); // 전체 데이터
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  // ── 검색 ──────────────────────────────────────────────
  const [searchType, setSearchType] = useState<'title' | 'writer'>('title');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // ── 페이지네이션 ───────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── 필터 + 검색 적용된 데이터 ─────────────────────────
  const filteredBoards = (() => {
    let data = allBoards;

    // 상태 필터
    if (filterStatus !== 'ALL') {
      data = data.filter((b) => b.status === filterStatus);
    }

    // 검색 필터
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      if (searchType === 'title') {
        data = data.filter((b) => b.title.toLowerCase().includes(keyword));
      } else {
        data = data.filter((b) => b.writerName.toLowerCase().includes(keyword));
      }
    }

    return data;
  })();

  const totalPages = Math.max(1, Math.ceil(filteredBoards.length / PAGE_SIZE));
  const pagedBoards = filteredBoards.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ── 데이터 불러오기 ────────────────────────────────────
  const fetchBoards = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await api.get<BoardItem[]>('/board/latest');
      setAllBoards(res.data);
      setCurrentPage(1);
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
      fetchBoards();
    }, [fetchBoards])
  );

  // 필터/검색 바뀌면 페이지 초기화 
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchKeyword, searchType]);

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingBottom: tabBarHeight }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>게시판</Text>
        <View style={styles.headerActions}>
          {user?.role === '목사' && (
            <TouchableOpacity
              style={styles.writeButton}
              onPress={() => router.push('/(tabs)/board/write')}
              activeOpacity={0.8}
            >
              <Text style={styles.writeButtonText}>+ 글쓰기</Text>
            </TouchableOpacity>
          )}
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
      </View>

      {/* 검색 바 */}
      <View style={styles.searchRow}>
        {/* 검색 타입 토글 */}
        <TouchableOpacity
          style={styles.searchTypeButton}
          onPress={() => setSearchType(searchType === 'title' ? 'writer' : 'title')}
          activeOpacity={0.8}
        >
          <Text style={styles.searchTypeText}>
            {searchType === 'title' ? '제목' : '작성자'}
          </Text>
        </TouchableOpacity>

        {/* 검색 입력 */}
        <TextInput
          style={styles.searchInput}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholder={searchType === 'title' ? '제목으로 검색' : '작성자로 검색'}
          placeholderTextColor="#AAAAAA"
          returnKeyType="search"
        />

        {/* 검색어 초기화 */}
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

      {/* 필터 탭 */}
      <View style={styles.filterRow}>
        {(['ALL', 'UNREAD', 'READ'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filterStatus === tab && styles.filterTabActive]}
            onPress={() => setFilterStatus(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, filterStatus === tab && styles.filterTabTextActive]}>
              {tab === 'ALL' ? '전체' : tab === 'UNREAD' ? '안읽음' : '읽음'}
            </Text>
          </TouchableOpacity>
        ))}

        {/* 검색 결과 수 */}
        {(searchKeyword.trim() || filterStatus !== 'ALL') && (
          <Text style={styles.resultCount}>{filteredBoards.length}개</Text>
        )}
      </View>

      {/* 목록 */}
      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : pagedBoards.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>
            {searchKeyword.trim() ? '검색 결과가 없습니다.' : '게시글이 없습니다.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={pagedBoards}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BoardCard
              item={item}
              onPress={() => router.push(`/(tabs)/board/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => fetchBoards(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          // ── 페이지네이션 ──────────────────────────────
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
    paddingBottom: 12,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#000000' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  writeButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  writeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  // 검색
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
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
  searchTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 2,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 13,
    color: '#999999',
  },

  // 필터
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterTabActive: { backgroundColor: '#000000' },
  filterTabText: { fontSize: 13, color: '#666666', fontWeight: '500' },
  filterTabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  resultCount: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },

  // 목록
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  separator: { height: 10 },
  card: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    position: 'relative',
  },
  cardUnread: {
    backgroundColor: '#F0F0F0',
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 0,
  },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#000000' },
  cardDate: { fontSize: 12, color: '#999999', flexShrink: 0 },
  cardContents: { fontSize: 14, color: '#444444', lineHeight: 20 },
  cardWriter: { fontSize: 12, color: '#999999', marginTop: 4 },

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
  pageButtonActive: {
    backgroundColor: '#000000',
  },
  pageButtonDisabled: {
    opacity: 0.3,
  },
  pageButtonText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '600',
  },
  pageButtonTextActive: {
    color: '#FFFFFF',
  },
  pageButtonTextDisabled: {
    color: '#999999',
  },
  ellipsis: {
    fontSize: 15,
    color: '#999999',
    paddingHorizontal: 4,
  },

  // 공통
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: '#999999' },
});