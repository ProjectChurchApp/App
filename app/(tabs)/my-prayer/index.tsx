// app/(tabs)/my-prayer/index.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Type } from '../../../constants/design';
import { STATUS_META, visibilityMeta } from '../../../constants/prayerMeta';
import { useAuth } from '../../../contexts/AuthContext';
import { PrayerItem, PrayerStatus } from '../../../types/prayer';
import { api } from '../../../utils/api';
import { formatDate, formatDateOnly } from '../../../utils/date';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  Avatar,
  Chip,
  EmptyState,
  FAB,
  FilterTabs,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
  useTabBarOverlap,
} from '../../../components/ui/primitives';

type StatusFilter = 'ALL' | PrayerStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PRAYING', label: '기도중' },
  { value: 'ANSWERED', label: '응답' },
  { value: 'CLOSED', label: '종료' },
];

// ─── 카드 ────────────────────────────────────────────────
function PrayerCard({
  item,
  onPress,
  onPray,
}: {
  item: PrayerItem;
  onPress: () => void;
  onPray: () => void;
}) {
  const status = STATUS_META[item.status];
  const visibility = visibilityMeta(item);

  return (
    <SurfaceCard onPress={onPress}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardDate}>{formatDate(item.createdDate)}</Text>
      </View>

      <Text style={styles.cardContents} numberOfLines={2}>
        {item.contents}
      </Text>

      <View style={styles.chipRow}>
        <Chip tone={status} />
        <Chip tone={visibility} />
        {item.statusChangedAt && item.status !== 'PRAYING' && (
          <Text style={styles.statusDate}>{formatDateOnly(item.statusChangedAt)}</Text>
        )}
      </View>

      <Pressable
        onPress={onPray}
        accessibilityRole="button"
        accessibilityLabel={`기도했어요, 현재 ${item.prayerCount}회`}
        android_ripple={{ color: 'rgba(107,45,107,0.15)' }}
        style={({ pressed }) => [styles.prayButton, pressed && styles.prayButtonPressed]}
      >
        <MaterialCommunityIcons
          name={item.hasPrayed ? 'hand-heart' : 'hand-heart-outline'}
          size={17}
          color={Palette.primary}
        />
        <Text style={styles.prayLabel}>기도했어요</Text>
        <View style={styles.prayCountWrap}>
          <Text style={styles.prayCount}>{item.prayerCount}</Text>
        </View>
      </Pressable>
    </SurfaceCard>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────
export default function MyPrayerScreen() {
  const insets = useSafeAreaInsets();
  const tabBarOverlap = useTabBarOverlap();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useFeedback();

  const [allPrayers, setAllPrayers] = useState<PrayerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const visiblePrayers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return allPrayers.filter((p) => {
      if (filter !== 'ALL' && p.status !== filter) return false;
      if (keyword && !p.title.toLowerCase().includes(keyword)) return false;
      return true;
    });
  }, [allPrayers, searchKeyword, filter]);

  const fetchPrayers = useCallback(
    async (refreshing = false) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await api.get<PrayerItem[]>('/prayer');
        setAllPrayers(res.data);
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
      fetchPrayers();
    }, [fetchPrayers])
  );

  const handlePray = async (prayerId: number) => {
    try {
      const res = await api.post<{ prayerCount: number; hasPrayed: boolean }>(
        `/prayer/${prayerId}/pray`
      );
      setAllPrayers((prev) =>
        prev.map((p) =>
          p.id === prayerId
            ? { ...p, prayerCount: res.data.prayerCount, hasPrayed: res.data.hasPrayed }
            : p
        )
      );
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    }
  };

  const hasAny = allPrayers.length > 0;
  const isFiltered = filter !== 'ALL' || searchKeyword.trim().length > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="나의기도"
        subtitle="간절한 마음을 전해보세요"
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      {/* 검색 */}
      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={20} color={Palette.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholder="제목으로 검색"
          placeholderTextColor={Palette.disabled}
          returnKeyType="search"
        />
        {searchKeyword.length > 0 && (
          <Pressable onPress={() => setSearchKeyword('')} hitSlop={10} accessibilityLabel="검색어 지우기">
            <MaterialCommunityIcons name="close-circle" size={18} color={Palette.disabled} />
          </Pressable>
        )}
      </View>

      {/* 상태 필터 */}
      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />

      {/* 목록 */}
      {isLoading ? (
        <SkeletonList />
      ) : visiblePrayers.length === 0 ? (
        <EmptyState
          icon={hasAny ? 'magnify-close' : 'hands-pray'}
          title={isFiltered ? '조건에 맞는 기도가 없어요' : '아직 작성한 기도가 없어요'}
          description={
            isFiltered
              ? '검색어나 상태 필터를 바꿔보세요.'
              : '마음에 있는 기도제목을 적어보세요. 필요하면 목사님께 요청할 수 있어요.'
          }
          actionLabel={isFiltered ? undefined : '첫 기도 작성하기'}
          onAction={isFiltered ? undefined : () => router.push('/(tabs)/my-prayer/write' as any)}
        />
      ) : (
        <FlatList
          data={visiblePrayers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PrayerCard
              item={item}
              onPress={() =>
                router.push({ pathname: '/(tabs)/my-prayer/[id]', params: { id: item.id } } as any)
              }
              onPray={() => handlePray(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarOverlap + 96 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => fetchPrayers(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        onPress={() => router.push('/(tabs)/my-prayer/write' as any)}
        label="작성"
      />
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
    paddingHorizontal: Spacing.md,
    height: 46,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceVariant,
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: Type.titleMedium.fontSize,
    fontWeight: Type.titleMedium.fontWeight,
    color: Palette.onSurface,
  },
  cardDate: {
    fontSize: Type.labelSmall.fontSize,
    color: Palette.onSurfaceVariant,
    flexShrink: 0,
  },
  cardContents: {
    fontSize: Type.bodyMedium.fontSize,
    lineHeight: Type.bodyMedium.lineHeight,
    color: Palette.onSurfaceVariant,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 2,
  },
  statusDate: {
    fontSize: Type.labelSmall.fontSize,
    color: Palette.onSurfaceVariant,
    marginLeft: 2,
  },

  // 기도했어요
  prayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: 6,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Palette.outline,
    overflow: 'hidden',
  },
  prayButtonPressed: { backgroundColor: Palette.primaryContainer },
  prayLabel: {
    fontSize: Type.label.fontSize,
    fontWeight: Type.label.fontWeight,
    color: Palette.primary,
  },
  prayCountWrap: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayCount: {
    fontSize: Type.labelSmall.fontSize,
    fontWeight: '700',
    color: Palette.onPrimaryContainer,
  },
});
