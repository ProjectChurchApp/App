// app/(tabs)/board/[id].tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentInputBar, CommentList } from '../../../components/CommentSection';
import { useAuth } from '../../../contexts/AuthContext';
import { BoardItem } from '../../../types/board';
import { CommentItem } from '../../../types/comment';
import { api } from '../../../utils/api';

type BoardDetail = BoardItem;

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
export default function BoardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── 댓글 상태 ─────────────────────────────────────────
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentItem | null>(null);

  // ── 게시글 불러오기 ────────────────────────────────────
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const [boardRes, commentsRes] = await Promise.all([
          api.get<BoardDetail>(`/board/${id}`),
          api.get<CommentItem[]>(`/comment/board/${id}`),
        ]);
        setBoard(boardRes.data);
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

    fetchBoard();
  }, [id]);

  // ── 게시글 삭제 ───────────────────────────────────────
  const handleDelete = () => {
    const doDelete = async () => {
      setIsDeleting(true);
      try {
        await api.delete(`/board/${id}`);
        router.back();
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? '삭제에 실패했습니다.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('이 게시글을 삭제하시겠습니까?')) doDelete();
    } else {
      Alert.alert('삭제', '이 게시글을 삭제하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // ── 댓글 작성 / 수정 ──────────────────────────────────
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);

    try {
      if (editingComment) {
        // 수정
        await api.put(`/comment/${editingComment.id}`, { contents: commentText.trim() });
        setComments((prev) =>
          prev.map((c) =>
            c.id === editingComment.id ? { ...c, contents: commentText.trim() } : c
          )
        );
        setEditingComment(null);
      } else {
        // 작성
        await api.post(`/comment/board/${id}`, { contents: commentText.trim() });
        // 댓글 목록 새로고침
        const res = await api.get<CommentItem[]>(`/comment/board/${id}`);
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
        await api.delete(`/comment/${commentId}`);
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

  // ── 댓글 수정 시작 ────────────────────────────────────
  const handleEditComment = (comment: CommentItem) => {
    setEditingComment(comment);
    setCommentText(comment.contents);
  };

  const isPastor = user?.role === '목사';
  const canEdit = !!board && !!user && (board.writerLoginID === user.loginID || isPastor);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!board) return null;

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

        {canEdit && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/(tabs)/board/write?id=${id}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.editButtonText}>수정</Text>
            </TouchableOpacity>
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
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 게시글 */}
        <View style={styles.articleWrapper}>
          <View style={styles.meta}>
            <View style={styles.metaLeft}>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>
                  {board.writerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.writerName}>{board.writerName}</Text>
                <Text style={styles.writerRole}>목사</Text>
              </View>
            </View>
            <Text style={styles.createdDate}>{formatDateFull(board.createdDate)}</Text>
          </View>

          <Text style={styles.articleTitle}>{board.title}</Text>
          <View style={styles.divider} />
          <Text style={styles.articleContents}>{board.contents}</Text>
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
        bottomPadding={insets.bottom + 60}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // 게시글
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
  writerRole: { fontSize: 11, color: '#999999', marginTop: 1 },
  createdDate: { fontSize: 12, color: '#999999' },
  articleTitle: { fontSize: 24, fontWeight: 'bold', color: '#000000', lineHeight: 32 },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 4 },
  articleContents: { fontSize: 16, color: '#333333', lineHeight: 26 },

  // 공통
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
