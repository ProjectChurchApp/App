// components/screens/PrayerDetailScreen.tsx
// 나의기도 / 성도기도요청 / 중보기도 탭에서 공통으로 쓰는 기도 상세 화면

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Radius, Spacing, Type } from '../../constants/design';
import { STATUS_META, STATUS_ORDER, visibilityMeta } from '../../constants/prayerMeta';
import { useAuth } from '../../contexts/AuthContext';
import { CommentItem } from '../../types/comment';
import { PrayerItem, PrayerStatus } from '../../types/prayer';
import { api } from '../../utils/api';
import { formatDateFull, formatDateOnly } from '../../utils/date';
import { CommentInputBar, CommentList } from '../CommentSection';
import { errorMessage, useFeedback } from '../ui/Feedback';
import { AppButton, Chip, SegmentedButtons } from '../ui/primitives';

type PrayerDetail = PrayerItem;

// ─── 아이콘 버튼 ─────────────────────────────────────────
function IconButton({
  icon,
  label,
  onPress,
  disabled,
  tone = Palette.onSurfaceVariant,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(107,45,107,0.15)', borderless: true, radius: 22 }}
      style={({ pressed }) => [styles.iconButton, (pressed || disabled) && { opacity: 0.55 }]}
    >
      <MaterialCommunityIcons name={icon} size={21} color={tone} />
    </Pressable>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────
export function PrayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();

  const [prayer, setPrayer] = useState<PrayerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentItem | null>(null);

  const isPastor = user?.role === '목사';

  // ── 데이터 불러오기 ────────────────────────────────────
  const fetchData = async () => {
    try {
      const [prayerRes, commentsRes] = await Promise.all([
        api.get<PrayerDetail>(`/prayer/${id}`),
        api.get<CommentItem[]>(`/prayer/${id}/comments`),
      ]);
      setPrayer(prayerRes.data);
      setComments(commentsRes.data);
    } catch (e: any) {
      toast(errorMessage(e), 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ── 삭제 ──────────────────────────────────────────────
  const handleDelete = async () => {
    const ok = await confirm({
      title: '기도 요청을 삭제할까요?',
      message: '삭제하면 댓글과 기도 기록도 함께 사라지고 되돌릴 수 없습니다.',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;

    setIsDeleting(true);
    try {
      await api.delete(`/prayer/${id}`);
      toast('삭제했습니다.', 'success');
      router.back();
    } catch (e: any) {
      toast(errorMessage(e, '삭제하지 못했습니다.'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── 상태 변경 ─────────────────────────────────────────
  const handleChangeStatus = async (status: PrayerStatus) => {
    if (!prayer || isUpdatingStatus || prayer.status === status) return;
    setIsUpdatingStatus(true);
    try {
      await api.put(`/prayer/${id}/status`, { status });
      setPrayer({
        ...prayer,
        status,
        statusChangedAt: status === 'PRAYING' ? null : new Date().toISOString(),
      });
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ── 중보기도로 공유 ───────────────────────────────────
  const handlePromote = async () => {
    const ok = await confirm({
      title: '중보기도로 공유',
      message: '중보기도 게시판에 올립니다. 목사님과 연결된 성도들이 함께 기도할 수 있게 됩니다.',
      confirmLabel: '공유하기',
    });
    if (!ok) return;

    setIsPromoting(true);
    try {
      await api.post(`/prayer/${id}/promote`);
      await fetchData();
      toast('중보기도 게시판에 올렸습니다.', 'success');
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  // ── 기도했어요 ────────────────────────────────────────
  const handlePray = async () => {
    if (!prayer) return;
    try {
      const res = await api.post<{ prayerCount: number; hasPrayed: boolean }>(`/prayer/${id}/pray`);
      setPrayer({ ...prayer, prayerCount: res.data.prayerCount, hasPrayed: res.data.hasPrayed });
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    }
  };

  // ── 댓글 작성/수정 ────────────────────────────────────
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);

    try {
      if (editingComment) {
        await api.put(`/prayer/comments/${editingComment.id}`, { contents: commentText.trim() });
        setComments((prev) =>
          prev.map((c) =>
            c.id === editingComment.id ? { ...c, contents: commentText.trim() } : c
          )
        );
        setEditingComment(null);
      } else {
        await api.post(`/prayer/${id}/comments`, { contents: commentText.trim() });
        const res = await api.get<CommentItem[]>(`/prayer/${id}/comments`);
        setComments(res.data);
      }
      setCommentText('');
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 댓글 삭제 ─────────────────────────────────────────
  const handleDeleteComment = async (commentId: number) => {
    const ok = await confirm({
      title: '댓글을 삭제할까요?',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/prayer/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: any) {
      toast(errorMessage(e, '삭제하지 못했습니다.'), 'error');
    }
  };

  const handleEditComment = (comment: CommentItem) => {
    setEditingComment(comment);
    setCommentText(comment.contents);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  if (!prayer) return null;

  const isPromoted = prayer.boardStage === 'INTERCESSORY';
  const isOwner = prayer.writerLoginID === user?.loginID;
  const isPromotingPastor = isPastor && prayer.promotedByLoginID === user?.loginID;
  const canManage = isPromoted ? isPromotingPastor : isOwner;
  const canPromote = isPastor && prayer.boardStage === 'SHARED_WITH_PASTOR';

  const visibility = visibilityMeta(prayer);
  const statusMeta = STATUS_META[prayer.status];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={insets.top}
    >
      {/* 상단 바 */}
      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.sm }]}>
        <IconButton icon="arrow-left" label="목록으로" onPress={() => router.back()} />
        {canManage && (
          <View style={styles.appBarActions}>
            <IconButton
              icon="pencil-outline"
              label="수정"
              onPress={() => router.push(`/(tabs)/my-prayer/write?id=${id}`)}
            />
            <IconButton
              icon="trash-can-outline"
              label="삭제"
              tone={Palette.danger}
              onPress={handleDelete}
              disabled={isDeleting}
            />
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 본문 */}
        <View style={styles.article}>
          <View style={styles.meta}>
            <View style={styles.metaLeft}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {prayer.writerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.metaText}>
                <Text style={styles.writerName}>
                  {isPromoted ? `기도요청자 ${prayer.writerName}` : prayer.writerName}
                </Text>
                <Text style={styles.createdDate}>{formatDateFull(prayer.createdDate)}</Text>
              </View>
            </View>
            <Chip tone={visibility} />
          </View>

          <Text style={styles.articleTitle}>{prayer.title}</Text>
          <Text style={styles.articleContents}>{prayer.contents}</Text>
        </View>

        {/* 상태 */}
        <View style={styles.block}>
          <View style={styles.blockHead}>
            <Text style={styles.blockLabel}>기도 상태</Text>
            {prayer.statusChangedAt && prayer.status !== 'PRAYING' && (
              <Text style={styles.statusDate}>
                {statusMeta.label} · {formatDateOnly(prayer.statusChangedAt)}
              </Text>
            )}
          </View>

          {canManage ? (
            <SegmentedButtons
              options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))}
              value={prayer.status}
              onChange={handleChangeStatus}
              disabled={isUpdatingStatus}
            />
          ) : (
            <Chip tone={statusMeta} />
          )}
        </View>

        {/* 기도했어요 */}
        <View style={styles.block}>
          <Pressable
            onPress={handlePray}
            accessibilityRole="button"
            accessibilityLabel={`기도했어요, 현재 ${prayer.prayerCount}회`}
            android_ripple={{ color: 'rgba(107,45,107,0.15)' }}
            style={({ pressed }) => [styles.prayButton, pressed && styles.prayButtonPressed]}
          >
            <MaterialCommunityIcons
              name={prayer.hasPrayed ? 'hand-heart' : 'hand-heart-outline'}
              size={20}
              color={Palette.onPrimary}
            />
            <Text style={styles.prayLabel}>기도했어요</Text>
            <View style={styles.prayCountWrap}>
              <Text style={styles.prayCount}>{prayer.prayerCount}</Text>
            </View>
          </Pressable>
          <Text style={styles.prayHint}>기도할 때마다 눌러주세요. 횟수가 쌓입니다.</Text>
        </View>

        {/* 중보기도로 공유 */}
        {canPromote && (
          <View style={styles.block}>
            <AppButton
              label="중보기도로 공유"
              icon="share-variant-outline"
              variant="tonal"
              fullWidth
              onPress={handlePromote}
              loading={isPromoting}
            />
          </View>
        )}

        {/* 댓글 */}
        <CommentList
          comments={comments}
          currentLoginID={user?.loginID ?? ''}
          isPastor={isPastor}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
        />
      </ScrollView>

      <CommentInputBar
        commentText={commentText}
        onChangeText={setCommentText}
        editingComment={editingComment}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitComment}
        onCancelEdit={() => {
          setEditingComment(null);
          setCommentText('');
        }}
        bottomPadding={tabBarHeight}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  centerBox: { alignItems: 'center', justifyContent: 'center' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  appBarActions: { flexDirection: 'row', gap: Spacing.xs },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },

  // 본문
  article: { gap: Spacing.md, paddingBottom: Spacing.xl },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1 },
  metaText: { flexShrink: 1 },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: '700',
    color: Palette.onPrimary,
  },
  writerName: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onSurface,
  },
  createdDate: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant, marginTop: 1 },
  articleTitle: {
    fontSize: Type.headlineSmall.fontSize,
    fontWeight: Type.headlineSmall.fontWeight,
    lineHeight: Type.headlineSmall.lineHeight,
    color: Palette.onSurface,
  },
  articleContents: {
    fontSize: Type.bodyLarge.fontSize,
    lineHeight: Type.bodyLarge.lineHeight,
    color: Palette.onSurface,
  },

  // 블록
  block: {
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.outlineVariant,
  },
  blockHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  blockLabel: {
    fontSize: Type.label.fontSize,
    fontWeight: Type.label.fontWeight,
    color: Palette.onSurfaceVariant,
    letterSpacing: 0.4,
  },
  statusDate: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant },

  // 기도했어요
  prayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    overflow: 'hidden',
  },
  prayButtonPressed: { opacity: 0.88 },
  prayLabel: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: '700',
    color: Palette.onPrimary,
  },
  prayCountWrap: {
    minWidth: 30,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayCount: { fontSize: Type.label.fontSize, fontWeight: '700', color: Palette.onPrimary },
  prayHint: {
    fontSize: Type.labelSmall.fontSize,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
  },
});
