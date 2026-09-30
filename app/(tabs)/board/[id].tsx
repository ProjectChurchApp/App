// app/(tabs)/board/[id].tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommentInputBar, CommentList } from '../../../components/CommentSection';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import { Avatar, Divider, IconButton } from '../../../components/ui/primitives';
import { Palette, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { BoardItem } from '../../../types/board';
import { CommentItem } from '../../../types/comment';
import { api } from '../../../utils/api';
import { formatDateFull } from '../../../utils/date';

type BoardDetail = BoardItem;

export default function BoardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { toast, confirm } = useFeedback();

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<CommentItem | null>(null);

  const isPastor = user?.role === '목사';

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
        toast(errorMessage(e), 'error');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();
  }, [id]);

  const handleDelete = async () => {
    const ok = await confirm({
      title: '게시글을 삭제할까요?',
      message: '댓글도 함께 사라지고 되돌릴 수 없어요.',
      confirmLabel: '삭제',
      destructive: true,
    });
    if (!ok) return;

    setIsDeleting(true);
    try {
      await api.delete(`/board/${id}`);
      toast('삭제했어요.', 'success');
      router.back();
    } catch (e: any) {
      toast(errorMessage(e, '삭제하지 못했어요.'), 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingComment) {
        await api.put(`/comment/${editingComment.id}`, { contents: commentText.trim() });
        setComments((prev) =>
          prev.map((c) => (c.id === editingComment.id ? { ...c, contents: commentText.trim() } : c))
        );
        setEditingComment(null);
      } else {
        await api.post(`/comment/board/${id}`, { contents: commentText.trim() });
        const res = await api.get<CommentItem[]>(`/comment/board/${id}`);
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
      await api.delete(`/comment/${commentId}`);
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

  if (!board) return null;

  // 요구사항상 목사님께 주어진 건 작성 권한과 성도 댓글 삭제뿐이므로 글은 작성자만 관리한다.
  const canManage = board.writerLoginID === user?.loginID;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.xs }]}>
        <IconButton icon="arrow-left" label="목록으로" onPress={() => router.back()} tone={Palette.onSurface} />
        {canManage && (
          <View style={styles.appBarActions}>
            <IconButton
              icon="pencil-outline"
              label="수정"
              onPress={() => router.push(`/(tabs)/board/write?id=${id}` as any)}
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
        <View style={styles.pad}>
          <Text style={styles.title}>{board.title}</Text>

          <View style={styles.meta}>
            <Avatar name={board.writerName} size={36} />
            <View style={styles.metaText}>
              <Text style={styles.writerName}>{board.writerName}</Text>
              <Text style={styles.createdDate}>{formatDateFull(board.createdDate)}</Text>
            </View>
          </View>

          <Text style={styles.body}>{board.contents}</Text>
        </View>

        <Divider style={styles.hr} />

        <View style={styles.pad}>
          <CommentList
            comments={comments}
            currentLoginID={user?.loginID ?? ''}
            isPastor={isPastor}
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
          />
        </View>
      </ScrollView>
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
  scrollContent: { paddingBottom: Spacing.xxxl },
  pad: { paddingHorizontal: Spacing.xxl },
  hr: { marginVertical: Spacing.xxl },

  title: {
    fontSize: Type.headlineSmall.fontSize,
    fontWeight: Type.headlineSmall.fontWeight,
    lineHeight: Type.headlineSmall.lineHeight,
    letterSpacing: Type.headlineSmall.letterSpacing,
    color: Palette.onSurface,
    marginTop: Spacing.sm,
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
});
