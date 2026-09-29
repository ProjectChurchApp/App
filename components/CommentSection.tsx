import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ICON_SM, Palette, Radius, Spacing, Type } from '../constants/design';
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
        <Text style={styles.sectionTitle}>댓글</Text>
        {comments.length > 0 && <Text style={styles.count}>{comments.length}</Text>}
      </View>

      {comments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>첫 댓글을 남겨보세요</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentLoginID={currentLoginID}
              isPastor={isPastor}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
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
}

export function CommentInputBar({
  commentText,
  onChangeText,
  editingComment,
  isSubmitting,
  onSubmit,
  onCancelEdit,
}: CommentInputBarProps) {
  const canSubmit = commentText.trim().length > 0 && !isSubmitting;

  return (
    <View style={styles.composer}>
      {editingComment && (
        <View style={styles.editingBanner}>
          <MaterialCommunityIcons name="pencil-outline" size={15} color={Palette.onPrimaryContainer} />
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
          placeholder="따뜻한 말 한마디를 남겨주세요"
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
            name={editingComment ? 'check' : 'arrow-up'}
            size={ICON_SM}
            color={Palette.onPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: {
    fontSize: Type.titleMedium.fontSize,
    fontWeight: Type.titleMedium.fontWeight,
    letterSpacing: Type.titleMedium.letterSpacing,
    color: Palette.onSurface,
  },
  count: {
    fontSize: Type.titleMedium.fontSize,
    fontWeight: '700',
    color: Palette.primary,
  },

  list: { gap: Spacing.lg },

  empty: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    backgroundColor: Palette.surfaceVariant,
    borderRadius: Radius.md,
  },
  emptyText: { fontSize: Type.bodyMedium.fontSize, color: Palette.onSurfaceVariant },

  composer: { marginTop: Spacing.xl, gap: Spacing.sm },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    backgroundColor: Palette.primaryContainer,
  },
  editingText: {
    flex: 1,
    fontSize: Type.labelSmall.fontSize,
    fontWeight: '600',
    color: Palette.onPrimaryContainer,
  },
  editingCancel: { fontSize: Type.labelSmall.fontSize, fontWeight: '700', color: Palette.danger },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: Palette.track,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Type.bodyMedium.fontSize,
    lineHeight: Type.bodyMedium.lineHeight,
    color: Palette.onSurface,
  },
  submit: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { backgroundColor: Palette.disabled },
});
