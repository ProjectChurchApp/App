// app/(tabs)/board/index.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  Avatar,
  EmptyState,
  FilterTabs,
  FAB,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
} from '../../../components/ui/primitives';
import { Palette, Radius, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';
import { formatDate } from '../../../utils/date';

interface BoardItem {
  id: number;
  title: string;
  contents: string;
  writerName: string;
  status: 'READ' | 'UNREAD';
  createdDate: string;
}

type Filter = 'ALL' | 'UNREAD' | 'READ';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'UNREAD', label: '안읽음' },
  { value: 'READ', label: '읽음' },
];

// ─── 카드 ────────────────────────────────────────────────
function BoardCard({ item, onPress }: { item: BoardItem; onPress: () => void }) {
  const isUnread = item.status === 'UNREAD';

  return (
    <SurfaceCard onPress={onPress} style={isUnread ? styles.cardUnread : undefined}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleRow}>
          {isUnread && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          <Text
            style={[styles.cardTitle, isUnread && styles.cardTitleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
        </View>
        <Text style={styles.cardDate}>{formatDate(item.createdDate)}</Text>
      </View>

      <Text style={styles.cardContents} numberOfLines={2}>
        {item.contents}
      </Text>

      <View style={styles.writerRow}>
        <MaterialCommunityIcons name="account-outline" size={14} color={Palette.onSurfaceVariant} />
        <Text style={styles.cardWriter}>{item.writerName}</Text>
      </View>
    </SurfaceCard>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────
export default function BoardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useFeedback();

  const [allBoards, setAllBoards] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<Filter>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<'title' | 'writer'>('title');

  const canWrite = user?.role === '목사';
  const unreadCount = allBoards.filter((b) => b.status === 'UNREAD').length;

  const visibleBoards = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return allBoards.filter((b) => {
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
      if (!keyword) return true;
      const field = searchType === 'title' ? b.title : b.writerName;
      return field.toLowerCase().includes(keyword);
    });
  }, [allBoards, filterStatus, searchKeyword, searchType]);

  const fetchBoards = useCallback(
    async (refreshing = false) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await api.get<BoardItem[]>('/board/latest');
        setAllBoards(res.data);
      } catch (e: any) {
        toast(errorMessage(e), 'error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [toast]
  );

  useFocusEffect(
    useCallback(() => {
      fetchBoards();
    }, [fetchBoards])
  );

  const isFiltered = filterStatus !== 'ALL' || searchKeyword.trim().length > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="게시판"
        subtitle={unreadCount > 0 ? `읽지 않은 공지 ${unreadCount}건` : '교회 소식과 공지'}
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      {/* 검색 */}
      <View style={styles.searchRow}>
        <Pressable
          onPress={() => setSearchType(searchType === 'title' ? 'writer' : 'title')}
          accessibilityRole="button"
          accessibilityLabel={`검색 기준 ${searchType === 'title' ? '제목' : '작성자'}, 눌러서 변경`}
          android_ripple={{ color: 'rgba(107,45,107,0.15)' }}
          style={styles.searchType}
        >
          <Text style={styles.searchTypeText}>{searchType === 'title' ? '제목' : '작성자'}</Text>
          <MaterialCommunityIcons name="swap-horizontal" size={14} color={Palette.primary} />
        </Pressable>

        <TextInput
          style={styles.searchInput}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholder={searchType === 'title' ? '제목으로 검색' : '작성자로 검색'}
          placeholderTextColor={Palette.disabled}
          returnKeyType="search"
        />

        {searchKeyword.length > 0 && (
          <Pressable onPress={() => setSearchKeyword('')} hitSlop={10} accessibilityLabel="검색어 지우기">
            <MaterialCommunityIcons name="close-circle" size={18} color={Palette.disabled} />
          </Pressable>
        )}
      </View>

      {/* 필터 */}
      <FilterTabs options={FILTERS} value={filterStatus} onChange={setFilterStatus} />

      {/* 목록 */}
      {isLoading ? (
        <SkeletonList />
      ) : visibleBoards.length === 0 ? (
        <EmptyState
          icon={isFiltered ? 'magnify-close' : 'bulletin-board'}
          title={isFiltered ? '조건에 맞는 글이 없어요' : '아직 올라온 글이 없어요'}
          description={
            isFiltered
              ? '검색어나 필터를 바꿔보세요.'
              : canWrite
                ? '성도들에게 전할 소식을 올려보세요.'
                : '목사님이 공지를 올리면 이곳에 표시됩니다.'
          }
          actionLabel={!isFiltered && canWrite ? '공지 작성하기' : undefined}
          onAction={
            !isFiltered && canWrite ? () => router.push('/(tabs)/board/write') : undefined
          }
        />
      ) : (
        <FlatList
          data={visibleBoards}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <BoardCard
              item={item}
              onPress={() =>
                router.push({ pathname: '/(tabs)/board/[id]', params: { id: item.id } } as any)
              }
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + (canWrite ? 96 : Spacing.xxl) },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => fetchBoards(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
        />
      )}

      {canWrite && (
        <FAB onPress={() => router.push('/(tabs)/board/write')} label="글쓰기" bottom={tabBarHeight} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },

  // 검색
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingLeft: 6,
    paddingRight: Spacing.md,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
  },
  searchType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    overflow: 'hidden',
  },
  searchTypeText: {
    fontSize: Type.label.fontSize,
    fontWeight: Type.label.fontWeight,
    color: Palette.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: Type.bodyMedium.fontSize,
    color: Palette.onSurface,
    paddingVertical: 0,
  },

  // 필터

  // 목록
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs },
  separator: { height: Spacing.md },

  // 카드
  cardUnread: { borderColor: Palette.primaryContainer, backgroundColor: '#FDFBFD' },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    backgroundColor: Palette.primary,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: Palette.onPrimary,
  },
  cardTitle: {
    flex: 1,
    fontSize: Type.titleMedium.fontSize,
    fontWeight: '600',
    color: Palette.onSurface,
  },
  cardTitleUnread: { fontWeight: '700' },
  cardDate: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant, flexShrink: 0 },
  cardContents: {
    fontSize: Type.bodyMedium.fontSize,
    lineHeight: Type.bodyMedium.lineHeight,
    color: Palette.onSurfaceVariant,
  },
  writerRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  cardWriter: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant },
});
