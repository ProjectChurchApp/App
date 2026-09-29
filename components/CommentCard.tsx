import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, Radius, Spacing, Type } from '../constants/design';
import { CommentItem } from '../types/comment';
import { formatDate } from '../utils/date';

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
      android_ripple={{ color: 'rgba(107,45,107,0.15)', borderless: true, radius: 18 }}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
    >
      <MaterialCommunityIcons name={icon} size={17} color={tone} />
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
  const canEdit = isMine;
  const canDelete = isMine || isPastor;

  return (
    <View style={[styles.card, isMine && styles.cardMine]}>
      <View style={styles.top}>
        <View style={styles.meta}>
          <View style={[styles.avatar, isMine && styles.avatarMine]}>
            <Text style={styles.avatarText}>{comment.writerName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.metaText}>
            <Text style={styles.writer}>{comment.writerName}</Text>
            <Text style={styles.date}>{formatDate(comment.createdDate)}</Text>
          </View>
        </View>

        {(canEdit || canDelete) && (
          <View style={styles.actions}>
            {canEdit && (
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

      <Text style={styles.contents}>{comment.contents}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surfaceContainer,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardMine: {
    backgroundColor: '#FBF7FB',
    borderColor: Palette.primaryContainer,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1 },
  metaText: { flexShrink: 1 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Palette.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMine: { backgroundColor: Palette.primary },
  avatarText: { color: Palette.onPrimary, fontSize: 12, fontWeight: '700' },
  writer: {
    fontSize: Type.labelSmall.fontSize + 1,
    fontWeight: '600',
    color: Palette.onSurface,
  },
  date: { fontSize: Type.labelSmall.fontSize, color: Palette.onSurfaceVariant },
  actions: { flexDirection: 'row', gap: 2 },
  action: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  contents: {
    fontSize: Type.bodyMedium.fontSize,
    lineHeight: 22,
    color: Palette.onSurface,
  },
});
