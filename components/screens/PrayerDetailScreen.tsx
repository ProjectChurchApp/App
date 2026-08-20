// components/screens/PrayerDetailScreen.tsx
// 나의기도 / 성도기도요청 / 중보기도 탭에서 공통으로 쓰는 기도 상세 화면

import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { CommentItem } from '../../types/comment';
import { PrayerItem, PrayerStatus } from '../../types/prayer';
import { api } from '../../utils/api';
import { CommentInputBar, CommentList } from '../CommentSection';

type PrayerDetail = PrayerItem;

const STATUS_LABELS: Record<PrayerStatus, string> = {
  PRAYING: '🙏 기도중',
  ANSWERED: '✅ 응답',
  CLOSED: '🔚 종료',
};

// ─── 날짜 포맷 ───────────────────────────────────────────
function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── 메인 화면 ───────────────────────────────────────────
export function PrayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();

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
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      if (Platform.OS === 'web') {
        window.alert(msg);
        router.back();
      } else {
        Alert.alert('오류', msg, [{ text: '확인', onPress: () => router.back() }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // ── 삭제 ──────────────────────────────────────────────
  const handleDelete = () => {
    const doDelete = async () => {
      setIsDeleting(true);
      try {
        await api.delete(`/prayer/${id}`);
        router.back();
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? '삭제에 실패했습니다.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('기도 요청을 삭제하시겠습니까?')) doDelete();
    } else {
      Alert.alert('삭제', '기도 요청을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // ── 상태 변경 ─────────────────────────────────────────
  const handleChangeStatus = async (status: PrayerStatus) => {
    if (!prayer || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await api.put(`/prayer/${id}/status`, { status });
      setPrayer({ ...prayer, status });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ── 중보기도로 공유 ───────────────────────────────────
  const handlePromote = () => {
    const doPromote = async () => {
      setIsPromoting(true);
      try {
        await api.post(`/prayer/${id}/promote`);
        await fetchData();
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
      } finally {
        setIsPromoting(false);
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

  // ── 기도했어요 토글 ────────────────────────────────────
  const handleTogglePray = async () => {
    if (!prayer) return;
    try {
      const res = await api.post<{ prayerCount: number; hasPrayed: boolean }>(`/prayer/${id}/pray`);
      setPrayer({ ...prayer, prayerCount: res.data.prayerCount, hasPrayed: res.data.hasPrayed });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
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
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 댓글 삭제 ─────────────────────────────────────────
  const handleDeleteComment = (commentId: number) => {
    const doDelete = async () => {
      try {
        await api.delete(`/prayer/comments/${commentId}`);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? '삭제에 실패했습니다.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('댓글을 삭제하시겠습니까?')) doDelete();
    } else {
      Alert.alert('삭제', '댓글을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleEditComment = (comment: CommentItem) => {
    setEditingComment(comment);
    setCommentText(comment.contents);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!prayer) return null;

  const isPromoted = prayer.boardStage === 'INTERCESSORY';
  const isOwner = prayer.writerLoginID === user?.loginID;
  const canManage = isPromoted ? isPastor : isOwner;
  const canPromote = isPastor && prayer.boardStage === 'SHARED_WITH_PASTOR';

  return (
    <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={insets.top}
    >
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← 목록</Text>
        </TouchableOpacity>

        {canManage && (
          <View style={styles.headerActions}>
            {!isPromoted && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push(`/(tabs)/my-prayer/write?id=${id}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.editButtonText}>수정</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting ? '삭제 중...' : '삭제'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 본문 + 댓글 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 기도 요청 본문 */}
        <View style={styles.articleWrapper}>
          <View style={styles.meta}>
            <View style={styles.metaLeft}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {prayer.writerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.writerName}>
                  {isPromoted ? `기도요청자: ${prayer.writerName}` : prayer.writerName}
                </Text>
                <Text style={styles.createdDate}>{formatDateFull(prayer.createdDate)}</Text>
              </View>
            </View>
            {!isPromoted && (
              <View style={[
                styles.visibilityBadge,
                prayer.visibility === 'PRIVATE' ? styles.badgePrivate : styles.badgePastor
              ]}>
                <Text style={styles.visibilityText}>
                  {prayer.visibility === 'PRIVATE' ? '🔒 나만보기' : '🙏 목사님께'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.articleTitle}>{prayer.title}</Text>
          <View style={styles.divider} />
          <Text style={styles.articleContents}>{prayer.contents}</Text>

          {/* 상태 */}
          <View style={styles.statusRow}>
            {(Object.keys(STATUS_LABELS) as PrayerStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  prayer.status === status && styles.statusButtonActive,
                  !canManage && styles.statusButtonDisabled,
                ]}
                onPress={() => handleChangeStatus(status)}
                disabled={!canManage || isUpdatingStatus}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.statusButtonText,
                  prayer.status === status && styles.statusButtonTextActive,
                ]}>
                  {STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 중보기도로 공유 (목사 전용) */}
          {canPromote && (
            <TouchableOpacity
              style={[styles.promoteButton, isPromoting && styles.buttonDisabled]}
              onPress={handlePromote}
              disabled={isPromoting}
              activeOpacity={0.8}
            >
              <Text style={styles.promoteButtonText}>
                {isPromoting ? '공유 중...' : '🙏 중보기도로 공유'}
              </Text>
            </TouchableOpacity>
          )}

          {/* 기도했어요 */}
          <TouchableOpacity
            style={[styles.prayButton, prayer.hasPrayed && styles.prayButtonActive]}
            onPress={handleTogglePray}
            activeOpacity={0.8}
          >
            <Text style={[styles.prayButtonText, prayer.hasPrayed && styles.prayButtonTextActive]}>
              🙏 기도했어요 {prayer.prayerCount}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 댓글 섹션 */}
        <CommentList
          comments={comments}
          currentLoginID={user?.loginID ?? ''}
          isPastor={isPastor}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
        />
      </ScrollView>

      {/* 댓글 입력창 */}
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
  backButtonText: { fontSize: 16, color: '#000000', fontWeight: '500' },
  headerActions: { flexDirection: 'row', gap: 8 },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  editButtonText: { fontSize: 13, color: '#000000', fontWeight: '600' },
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },

  // 본문
  articleWrapper: { gap: 16, marginBottom: 24 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  writerName: { fontSize: 14, fontWeight: '700', color: '#000000' },
  createdDate: { fontSize: 11, color: '#999999', marginTop: 1 },
  visibilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePrivate: { backgroundColor: '#F0F0F0' },
  badgePastor: { backgroundColor: '#FFF3E0' },
  visibilityText: { fontSize: 11, fontWeight: '600', color: '#666666' },
  articleTitle: { fontSize: 24, fontWeight: 'bold', color: '#000000', lineHeight: 32 },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 4 },
  articleContents: { fontSize: 16, color: '#333333', lineHeight: 26 },

  // 상태
  statusRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
  },
  statusButtonActive: { backgroundColor: '#000000' },
  statusButtonDisabled: { opacity: 0.5 },
  statusButtonText: { fontSize: 13, fontWeight: '600', color: '#666666' },
  statusButtonTextActive: { color: '#FFFFFF' },

  // 중보기도 공유
  promoteButton: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
  },
  promoteButtonText: { fontSize: 14, fontWeight: '700', color: '#B8752E' },

  // 기도해요 버튼
  prayButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  prayButtonActive: { backgroundColor: '#000000' },
  prayButtonText: { fontSize: 13, fontWeight: '600', color: '#666666' },
  prayButtonTextActive: { color: '#FFFFFF' },

  // 공통
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
