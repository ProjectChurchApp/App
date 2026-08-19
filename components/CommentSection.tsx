import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CommentItem } from '../types/comment';
import { CommentCard } from './CommentCard';

interface CommentListProps {
  comments: CommentItem[];
  currentLoginID: string;
  isPastor: boolean;
  onEdit: (comment: CommentItem) => void;
  onDelete: (id: number) => void;
}

export function CommentList({ comments, currentLoginID, isPastor, onEdit, onDelete }: CommentListProps) {
  return (
    <View style={styles.commentSection}>
      <Text style={styles.commentSectionTitle}>
        댓글 {comments.length > 0 ? `${comments.length}` : ''}
      </Text>

      {comments.length === 0 ? (
        <View style={styles.commentEmpty}>
          <Text style={styles.commentEmptyText}>첫 댓글을 작성해보세요</Text>
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
  return (
    <View style={[styles.commentInputWrapper, { paddingBottom: bottomPadding }]}>
      {editingComment && (
        <View style={styles.editingBanner}>
          <Text style={styles.editingBannerText}>댓글 수정 중</Text>
          <TouchableOpacity onPress={onCancelEdit}>
            <Text style={styles.editingCancelText}>취소</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={onChangeText}
          placeholder="댓글을 입력하세요"
          placeholderTextColor="#AAAAAA"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.commentSubmitButton,
            (!commentText.trim() || isSubmitting) && styles.commentSubmitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={!commentText.trim() || isSubmitting}
          activeOpacity={0.8}>
          <Text style={styles.commentSubmitButtonText}>
            {isSubmitting ? '...' : editingComment ? '수정' : '등록'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  commentSection: { gap: 12 },
  commentSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  commentEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  commentEmptyText: { fontSize: 14, color: '#999999' },
  commentInputWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  editingBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  editingBannerText: { fontSize: 12, color: '#666666' },
  editingCancelText: { fontSize: 12, color: '#FF3B30', fontWeight: '600' },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F4F4F4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
    maxHeight: 100,
  },
  commentSubmitButton: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  commentSubmitButtonDisabled: { opacity: 0.3 },
  commentSubmitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
