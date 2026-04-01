// app/(tabs)/board/[id].tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api'; // ← axios 인스턴스 (토큰 자동 첨부)

// ─── 타입 ───────────────────────────────────────────────
interface BoardDetail {
  id: number;
  title: string;
  contents: string;
  writerName: string;
  status: 'READ' | 'UNREAD';
  createdDate: string;
}

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
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // const isPastor = user?.role === '목사';

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── 상세 불러오기 (읽음 처리 자동) ──────────────────────
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const res = await api.get<BoardDetail>(`/board/${id}`);
        setBoard(res.data);
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

  // ── 삭제 ──────────────────────────────────────────────
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

  // 🔐 목사이면서 본인 글일 때만 수정/삭제 표시
  // 정확한 비교를 위해 백엔드 BoardResponseDto에 writerLoginID 추가를 권장
  const canEdit = board?.writerName === user?.name;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!board) return null;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← 목록</Text>
        </TouchableOpacity>

        {/* 🔐 목사 + 본인 글일 때만 */}
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

      {/* 본문 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height - insets.top - insets.bottom - 70 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.articleWrapper}>
          {/* 메타 */}
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

          {/* 제목 */}
          <Text style={styles.articleTitle}>{board.title}</Text>
          <View style={styles.divider} />

          {/* 내용 */}
          <Text style={styles.articleContents}>{board.contents}</Text>
        </View>
      </ScrollView>
    </View>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  articleWrapper: { gap: 16 },
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
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
