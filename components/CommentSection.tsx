import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Palette, Radius, Spacing, Type } from '../constants/design';
import { CommentItem } from '../types/comment';
import { CommentCard } from './CommentCard';

interface CommentListProps {
  comments: CommentItem[];
  currentLoginID: string;
  isPastor: boolean;
  onEdit: (comment: CommentItem) => void;
  onDelete: (id: number) => void;
}

export function CommentList({
  comments,
  currentLoginID,
  isPastor,
  onEdit,
  onDelete,
}: CommentListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons
          name="comment-text-outline"
          size={17}
          color={Palette.onSurfaceVariant}
        />
        <Text style={styles.sectionTitle}>댓글</Text>
        {comments.length > 0 && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{comments.length}</Text>
          </View>
        )}
      </View>

      {comments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>첫 댓글을 남겨보세요</Text>
        </View>
      ) : (
        comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            currentLoginID={currentLoginID}
            isPastor={isPastor}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </View>
  );
}

interface CommentInputBarProps {
  commentText: string;
  onChangeText: (text: string) => void;
  editingComment: CommentItem | null;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancelEdit: () => void;
  bottomPadding: number;
}

export function CommentInputBar({
  commentText,
  onChangeText,
  editingComment,
  isSubmitting,
  onSubmit,
  onCancelEdit,
  bottomPadding,
}: CommentInputBarProps) {
  const canSubmit = commentText.trim().length > 0 && !isSubmitting;

  return (
    <View style={[styles.inputWrapper, { paddingBottom: bottomPadding + Spacing.sm }]}>
      {editingComment && (
        <View style={styles.editingBanner}>
          <MaterialCommunityIcons name="pencil-outline" size={14} color={Palette.onPrimaryContainer} />
          <Text style={styles.editingText}>댓글 수정 중</Text>
          <Pressable onPress={onCancelEdit} hitSlop={10} accessibilityRole="button">
            <Text style={styles.editingCancel}>취소</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={commentText}
          onChangeText={onChangeText}
          placeholder="댓글을 입력하세요"
          placeholderTextColor={Palette.disabled}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={editingComment ? '댓글 수정' : '댓글 등록'}
          accessibilityState={{ disabled: !canSubmit }}
          android_ripple={{ color: 'rgba(255,255,255,0.24)', borderless: true, radius: 22 }}
          style={({ pressed }) => [
            styles.submit,
            !canSubmit && styles.submitDisabled,
            pressed && canSubmit && { opacity: 0.85 },
          ]}
        >
          <MaterialCommunityIcons
            name={editingComment ? 'check' : 'send'}
            size={20}
            color={Palette.onPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.outlineVariant,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: '700',
    color: Palette.onSurface,
  },
  countPill: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
  },
  countText: {
    fontSize: Type.labelSmall.fontSize,
    fontWeight: '700',
    color: Palette.onPrimaryContainer,
  },
  empty: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.md,
  },
  emptyText: { fontSize: Type.bodyMedium.fontSize, color: Palette.onSurfaceVariant },

  inputWrapper: {
    borderTopWidth: 1,
    borderTopColor: Palette.outlineVariant,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Palette.surface,
  },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primaryContainer,
  },
  editingText: {
    flex: 1,
    fontSize: Type.labelSmall.fontSize,
    color: Palette.onPrimaryContainer,
    fontWeight: '600',
  },
  editingCancel: {
    fontSize: Type.labelSmall.fontSize,
    fontWeight: '700',
    color: Palette.danger,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Type.bodyMedium.fontSize,
    color: Palette.onSurface,
  },
  submit: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { backgroundColor: Palette.disabled },
});
