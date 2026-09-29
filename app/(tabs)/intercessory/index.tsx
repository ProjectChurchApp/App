// app/(tabs)/intercessory/index.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  Avatar,
  Chip,
  EmptyState,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
  useTabBarOverlap,
} from '../../../components/ui/primitives';
import { Palette, Radius, Spacing, Type } from '../../../constants/design';
import { STATUS_META } from '../../../constants/prayerMeta';
import { useAuth } from '../../../contexts/AuthContext';
import { PrayerItem } from '../../../types/prayer';
import { api } from '../../../utils/api';
import { formatDate, formatDateOnly } from '../../../utils/date';

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
        <View style={styles.requester}>
          <MaterialCommunityIcons name="account-outline" size={14} color={Palette.onSurfaceVariant} />
          <Text style={styles.requesterText}>{item.writerName}</Text>
        </View>
        <Chip tone={status} />
        {item.statusChangedAt && item.status !== 'PRAYING' && (
          <Text style={styles.statusDate}>{formatDateOnly(item.statusChangedAt)}</Text>
        )}
      </View>

      <Pressable
        onPress={onPray}
        accessibilityRole="button"
        accessibilityLabel={`함께 기도했어요, 현재 ${item.prayerCount}회`}
        android_ripple={{ color: 'rgba(107,45,107,0.15)' }}
        style={({ pressed }) => [styles.prayButton, pressed && styles.prayButtonPressed]}
      >
        <MaterialCommunityIcons
          name={item.hasPrayed ? 'hand-heart' : 'hand-heart-outline'}
          size={17}
          color={Palette.primary}
        />
        <Text style={styles.prayLabel}>함께 기도했어요</Text>
        <View style={styles.prayCountWrap}>
          <Text style={styles.prayCount}>{item.prayerCount}</Text>
        </View>
      </Pressable>
    </SurfaceCard>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────
export default function IntercessoryScreen() {
  const insets = useSafeAreaInsets();
  const tabBarOverlap = useTabBarOverlap();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useFeedback();

  const [allPrayers, setAllPrayers] = useState<PrayerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const visiblePrayers = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return allPrayers;
    return allPrayers.filter(
      (p) =>
        p.title.toLowerCase().includes(keyword) || p.writerName.toLowerCase().includes(keyword)
    );
  }, [allPrayers, searchKeyword]);

  const fetchPrayers = useCallback(
    async (refreshing = false) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await api.get<PrayerItem[]>('/prayer/intercessory');
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

  const isSearching = searchKeyword.trim().length > 0;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="중보기도"
        subtitle="함께 기도해주세요"
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      <View style={styles.searchRow}>
        <MaterialCommunityIcons name="magnify" size={20} color={Palette.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholder="제목 또는 이름으로 검색"
          placeholderTextColor={Palette.disabled}
          returnKeyType="search"
        />
        {isSearching && (
          <Pressable onPress={() => setSearchKeyword('')} hitSlop={10} accessibilityLabel="검색어 지우기">
            <MaterialCommunityIcons name="close-circle" size={18} color={Palette.disabled} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <SkeletonList />
      ) : visiblePrayers.length === 0 ? (
        <EmptyState
          icon={isSearching ? 'magnify-close' : 'hands-pray'}
          title={isSearching ? '검색 결과가 없어요' : '아직 중보기도 요청이 없어요'}
          description={
            isSearching
              ? '다른 말로 찾아보세요.'
              : '목사님이 성도의 기도를 이곳에 올리면 함께 기도할 수 있어요.'
          }
        />
      ) : (
        <FlatList
          data={visiblePrayers}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PrayerCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/intercessory/[id]',
                  params: { id: item.id },
                } as any)
              }
              onPray={() => handlePray(item.id)}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: tabBarOverlap + Spacing.xxl }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => fetchPrayers(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },

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

  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xs },
  separator: { height: Spacing.md },

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
  cardDate: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant, flexShrink: 0 },
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
  requester: { flexDirection: 'row', alignItems: 'center', gap: 3, marginRight: Spacing.xs },
  requesterText: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant },
  statusDate: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant, marginLeft: 2 },

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
