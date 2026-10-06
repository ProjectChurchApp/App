// components/screens/PrayerDetailScreen.tsx
// 나의기도 / 성도기도요청 / 중보기도 탭에서 공통으로 쓰는 기도 상세 화면
//
// 기도문과 댓글이 이 앱의 알맹이라, 둘 다 접지 않고 읽기 좋게 펼쳐둔다.
// 가장 자주 누르는 "기도했어요"만 화면 하단에 고정한다.

import { useLocalSearchParams, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, Spacing, Type } from '../../constants/design';
import { STATUS_META, STATUS_ORDER, visibilityMeta } from '../../constants/prayerMeta';
import { useAuth } from '../../contexts/AuthContext';
import { CommentItem } from '../../types/comment';
import { PrayerItem, PrayerStatus } from '../../types/prayer';
import { api } from '../../utils/api';
import { formatDateFull, formatDateOnly } from '../../utils/date';
import { CommentInputBar, CommentList } from '../CommentSection';
import { errorMessage, useFeedback } from '../ui/Feedback';
import {
  AppButton,
  Avatar,
  BottomAction,
  Chip,
  Divider,
  IconButton,
  SelectMenu,
} from '../ui/primitives';

type PrayerDetail = PrayerItem;

export function PrayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();
  const scrollRef = useRef<ScrollView>(null);

  // 수정 화면은 지금 보고 있는 탭 안에서 열어야 한다.
  // 항상 my-prayer로 보내면 다른 탭에서 열었을 때 나의기도 스택에 수정 화면이 쌓여
  // 나중에 그 탭으로 돌아왔을 때 수정 화면이 먼저 보인다.
  const currentTab = (segments as string[])[1] ?? 'my-prayer';

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
  const isAdmin = user?.role === '관리자';

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

  const handleDelete = async () => {
    const ok = await confirm({
      title: '기도 요청을 삭제할까요?',
      message: '댓글과 기도 기록도 함께 사라지고 되돌릴 수 없어요.',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;

    setIsDeleting(true);
    try {
      await api.delete(`/prayer/${id}`);
      toast('삭제했어요.', 'success');
      router.back();
    } catch (e: any) {
      toast(errorMessage(e, '삭제하지 못했어요.'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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

  const handlePromote = async () => {
    const ok = await confirm({
      title: '중보기도로 공유할까요?',
      message: '중보기도 게시판에 올라가고, 목사님과 연결된 성도들이 함께 기도할 수 있어요.',
      confirmLabel: '공유하기',
    });
    if (!ok) return;

    setIsPromoting(true);
    try {
      await api.post(`/prayer/${id}/promote`);
      await fetchData();
      toast('중보기도 게시판에 올렸어요.', 'success');
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  const handlePray = async () => {
    if (!prayer) return;
    try {
      const res = await api.post<{ prayerCount: number; hasPrayed: boolean }>(`/prayer/${id}/pray`);
      setPrayer({ ...prayer, prayerCount: res.data.prayerCount, hasPrayed: res.data.hasPrayed });
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingComment) {
        await api.put(`/prayer/comments/${editingComment.id}`, { contents: commentText.trim() });
        setComments((prev) =>
          prev.map((c) => (c.id === editingComment.id ? { ...c, contents: commentText.trim() } : c))
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

  const handleDeleteComment = async (commentId: number) => {
    const ok = await confirm({ title: '댓글을 삭제할까요?', confirmLabel: '삭제', destructive: true });
    if (!ok) return;
    try {
      await api.delete(`/prayer/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: any) {
      toast(errorMessage(e, '삭제하지 못했어요.'), 'error');
    }
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
  // 목사님 목록에는 자신과 연결된 성도의 글만 오므로, 공유 단계면 담당 목사님이다.
  const isSharedWithMe = isPastor && prayer.boardStage === 'SHARED_WITH_PASTOR';

  // 기도의 주인은 작성자다. 중보기도로 올라간 뒤에도 본인은 계속 손댈 수 있다.
  const canEdit = isOwner || isSharedWithMe || isPromotingPastor || isAdmin;
  // 여럿이 함께 기도하는 글이 한 사람 판단으로 사라지지 않도록 승격 후 삭제는 담당 목사님만.
  const canDelete = isAdmin || (isPromoted ? isPromotingPastor : isOwner);
  const canPromote = isSharedWithMe;

  const statusMeta = STATUS_META[prayer.status];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.xs }]}>
        <IconButton icon="arrow-left" label="목록으로" onPress={() => router.back()} tone={Palette.onSurface} />
        {(canEdit || canDelete) && (
          <View style={styles.appBarActions}>
            {canEdit && (
              <IconButton
                icon="pencil-outline"
                label="수정"
                onPress={() => router.push(`/(tabs)/${currentTab}/write?id=${id}` as any)}
              />
            )}
            {canDelete && (
              <IconButton
                icon="trash-can-outline"
                label="삭제"
                tone={Palette.danger}
                onPress={handleDelete}
                disabled={isDeleting}
              />
            )}
          </View>
        )}
      </View>

      {canEdit && (
        <View style={styles.statusRow}>
          <SelectMenu
            label="기도 상태"
            options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_META[s].label }))}
            value={prayer.status}
            onChange={handleChangeStatus}
            tone={{ fg: statusMeta.fg, bg: statusMeta.bg }}
            disabled={isUpdatingStatus}
          />
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 기도문 */}
        <View style={styles.pad}>
          <View style={styles.chipRow}>
            {!canEdit && <Chip tone={statusMeta} />}
            <Chip tone={visibilityMeta(prayer)} />
            {prayer.statusChangedAt && prayer.status !== 'PRAYING' && (
              <Text style={styles.statusDate}>{formatDateOnly(prayer.statusChangedAt)}</Text>
            )}
          </View>

          <Text style={styles.title}>{prayer.title}</Text>

          <View style={styles.meta}>
            <Avatar name={prayer.writerName} size={36} />
            <View style={styles.metaText}>
              <Text style={styles.writerName}>
                {isPromoted ? `기도요청자 ${prayer.writerName}` : prayer.writerName}
              </Text>
              <Text style={styles.createdDate}>{formatDateFull(prayer.createdDate)}</Text>
            </View>
          </View>

          <Text style={styles.body}>{prayer.contents}</Text>
        </View>

        {canPromote && (
          <>
            <Divider style={styles.hr} />
            <View style={styles.pad}>
              <AppButton
                label="중보기도로 공유"
                icon="bullhorn-outline"
                variant="tonal"
                fullWidth
                onPress={handlePromote}
                loading={isPromoting}
              />
            </View>
          </>
        )}

        <Divider style={styles.hr} />

        {/* 댓글 */}
        <View style={styles.pad}>
          <CommentList
            comments={comments}
            currentLoginID={user?.loginID ?? ''}
            isPastor={isPastor || isAdmin}
            onEdit={(comment) => {
              setEditingComment(comment);
              setCommentText(comment.contents);
            }}
            onDelete={handleDeleteComment}
          />

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
            onFocus={() =>
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)
            }
          />
        </View>
      </ScrollView>

      <BottomAction
        label="기도했어요"
        icon={prayer.hasPrayed ? 'hand-heart' : 'hand-heart-outline'}
        count={prayer.prayerCount}
        onPress={handlePray}
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
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  appBarActions: { flexDirection: 'row' },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl },
  pad: { paddingHorizontal: Spacing.xxl },
  hr: { marginVertical: Spacing.xxl },

  chipRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  statusDate: { ...Type.labelSmall, fontWeight: '400', color: Palette.onSurfaceVariant, marginLeft: 2 },

  title: {
    fontSize: Type.headlineSmall.fontSize,
    fontWeight: Type.headlineSmall.fontWeight,
    lineHeight: Type.headlineSmall.lineHeight,
    letterSpacing: Type.headlineSmall.letterSpacing,
    color: Palette.onSurface,
    marginTop: Spacing.md,
  },

  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  metaText: { flexShrink: 1 },
  writerName: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onSurface,
  },
  createdDate: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant, marginTop: 1 },

  body: {
    fontSize: Type.reading.fontSize,
    lineHeight: Type.reading.lineHeight,
    letterSpacing: Type.reading.letterSpacing,
    color: '#2B2730',
    marginTop: Spacing.xl,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
});
