import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CommentItem } from '../types/comment';

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

interface CommentCardProps {
  comment: CommentItem;
  currentLoginID: string;
  isPastor: boolean;
  onEdit: (comment: CommentItem) => void;
  onDelete: (id: number) => void;
}

export function CommentCard({ comment, currentLoginID, isPastor, onEdit, onDelete }: CommentCardProps) {
  const isMine = comment.writerLoginID === currentLoginID;
  const canEdit = isMine;
  const canDelete = isMine || isPastor;

  return (
    <View style={styles.commentCard}>
      <View style={styles.commentTop}>
        <View style={styles.commentMeta}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {comment.writerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.commentWriter}>{comment.writerName}</Text>
            <Text style={styles.commentDate}>{formatDate(comment.createdDate)}</Text>
          </View>
        </View>
        {(canEdit || canDelete) && (
          <View style={styles.commentActions}>
            {canEdit && (
              <TouchableOpacity onPress={() => onEdit(comment)} activeOpacity={0.7}>
                <Text style={styles.commentActionText}>수정</Text>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity onPress={() => onDelete(comment.id)} activeOpacity={0.7}>
                <Text style={[styles.commentActionText, { color: '#FF3B30' }]}>삭제</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      <Text style={styles.commentContents}>{comment.contents}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  commentCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  commentWriter: { fontSize: 13, fontWeight: '600', color: '#000000' },
  commentDate: { fontSize: 11, color: '#999999' },
  commentActions: { flexDirection: 'row', gap: 12 },
  commentActionText: { fontSize: 12, color: '#666666', fontWeight: '500' },
  commentContents: { fontSize: 14, color: '#333333', lineHeight: 22 },
});
