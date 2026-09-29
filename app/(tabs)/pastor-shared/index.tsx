// app/(tabs)/pastor-shared/index.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import {
  AppButton,
  Avatar,
  Chip,
  EmptyState,
  ScreenHeader,
  SkeletonList,
  SurfaceCard,
} from '../../../components/ui/primitives';
import { Palette, Spacing, Type } from '../../../constants/design';
import { STATUS_META } from '../../../constants/prayerMeta';
import { useAuth } from '../../../contexts/AuthContext';
import { PrayerItem } from '../../../types/prayer';
import { api } from '../../../utils/api';
import { formatDate } from '../../../utils/date';

export default function PastorSharedScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();

  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [promotingID, setPromotingID] = useState<number | null>(null);

  const fetchPrayers = useCallback(
    async (refreshing = false) => {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const res = await api.get<PrayerItem[]>('/prayer');
        setPrayers(res.data.filter((p) => p.boardStage === 'SHARED_WITH_PASTOR'));
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

  const handlePromote = async (item: PrayerItem) => {
    const ok = await confirm({
      title: '중보기도로 공유',
      message: `"${item.title}"을(를) 중보기도 게시판에 올립니다. 목사님과 연결된 성도들이 함께 기도할 수 있게 됩니다.`,
      confirmLabel: '공유하기',
    });
    if (!ok) return;

    setPromotingID(item.id);
    try {
      await api.post(`/prayer/${item.id}/promote`);
      setPrayers((prev) => prev.filter((p) => p.id !== item.id));
      toast('중보기도 게시판에 올렸습니다.', 'success');
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setPromotingID(null);
    }
  };

  const requestedCount = prayers.filter((p) => p.intercessoryRequested).length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="성도기도요청"
        subtitle={
          requestedCount > 0
            ? `중보기도를 요청한 기도 ${requestedCount}건`
            : '나에게 공유된 기도 요청'
        }
        paddingTop={insets.top + Spacing.lg}
        right={<Avatar name={user?.name} onPress={() => router.push('/(tabs)/profile')} />}
      />

      {isLoading ? (
        <SkeletonList />
      ) : prayers.length === 0 ? (
        <EmptyState
          icon="inbox-outline"
          title="공유된 기도 요청이 없어요"
          description="연결된 성도가 기도를 공유하면 이곳에 도착합니다."
        />
      ) : (
        <FlatList
          data={prayers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xxl },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={() => fetchPrayers(true)}
          refreshing={isRefreshing}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SurfaceCard
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/pastor-shared/[id]',
                  params: { id: item.id },
                } as any)
              }
            >
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
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={14}
                    color={Palette.onSurfaceVariant}
                  />
                  <Text style={styles.requesterText}>{item.writerName}</Text>
                </View>
                <Chip tone={STATUS_META[item.status]} />
                {item.intercessoryRequested && (
                  <Chip
                    tone={{
                      label: '중보기도 요청',
                      fg: Palette.onSecondaryContainer,
                      bg: Palette.secondaryContainer,
                    }}
                  />
                )}
              </View>

              <AppButton
                label="중보기도로 공유"
                icon="share-variant-outline"
                variant="tonal"
                onPress={() => handlePromote(item)}
                loading={promotingID === item.id}
                style={styles.promoteButton}
              />
            </SurfaceCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },

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

  promoteButton: { alignSelf: 'flex-start', marginTop: Spacing.xs },
});
