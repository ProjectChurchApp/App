import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ICON_SM, Palette, Radius, Spacing, Type } from '../constants/design';
import { CommentItem } from '../types/comment';
import { formatDate } from '../utils/date';
import { Avatar } from './ui/primitives';

interface CommentCardProps {
  comment: CommentItem;
  currentLoginID: string;
  isPastor: boolean;
  onEdit: (comment: CommentItem) => void;
  onDelete: (id: number) => void;
}

function ActionButton({
  icon,
  label,
  onPress,
  tone,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  tone: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      android_ripple={{ color: 'rgba(107,45,107,0.15)', borderless: true, radius: 20 }}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
    >
      <MaterialCommunityIcons name={icon} size={ICON_SM} color={tone} />
    </Pressable>
  );
}

export function CommentCard({
  comment,
  currentLoginID,
  isPastor,
  onEdit,
  onDelete,
}: CommentCardProps) {
  const isMine = comment.writerLoginID === currentLoginID;
  const canDelete = isMine || isPastor;

  return (
    <View style={styles.row}>
      <Avatar name={comment.writerName} size={36} />

      <View style={styles.right}>
        <View style={styles.head}>
          <Text style={styles.writer} numberOfLines={1}>
            {comment.writerName}
          </Text>
          {isMine && (
            <View style={styles.mineTag}>
              <Text style={styles.mineTagText}>나</Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(comment.createdDate)}</Text>
        </View>

        <Text style={styles.contents}>{comment.contents}</Text>

        {(isMine || canDelete) && (
          <View style={styles.actions}>
            {isMine && (
              <ActionButton
                icon="pencil-outline"
                label="댓글 수정"
                onPress={() => onEdit(comment)}
                tone={Palette.onSurfaceVariant}
              />
            )}
            {canDelete && (
              <ActionButton
                icon="trash-can-outline"
                label="댓글 삭제"
                onPress={() => onDelete(comment.id)}
                tone={Palette.danger}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  right: { flex: 1, minWidth: 0 },

  head: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  writer: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: Type.titleSmall.fontWeight,
    color: Palette.onSurface,
    flexShrink: 1,
  },
  mineTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    backgroundColor: Palette.primaryContainer,
  },
  mineTagText: { fontSize: 10, fontWeight: '700', color: Palette.onPrimaryContainer },
  date: { fontSize: Type.labelSmall.fontSize, fontWeight: '400', color: Palette.onSurfaceVariant },

  contents: {
    fontSize: Type.bodyLarge.fontSize,
    lineHeight: Type.bodyLarge.lineHeight,
    letterSpacing: Type.bodyLarge.letterSpacing,
    color: '#2B2730',
    marginTop: 5,
  },

  actions: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm },
  action: { minWidth: 28, minHeight: 28, alignItems: 'center', justifyContent: 'center' },
});
