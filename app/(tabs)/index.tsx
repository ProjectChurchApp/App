// app/(tabs)/index.tsx

import { useRouter } from 'expo-router';
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
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

// ─── 타입 ───────────────────────────────────────────────
interface BoardItem {
  id: number;
  title: string;
  contents: string;
  writerName: string;
  status: 'READ' | 'UNREAD';
  createdDate: string;
}

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────
function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0)
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

// ─── 메인 화면 ───────────────────────────────────────────
export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [unreadPosts, setUnreadPosts] = useState<BoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const contentWidth = Math.min(width * 0.95, 600);

  // ── 안읽은 게시글 불러오기 ────────────────────────────
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get<BoardItem[]>('/board/status/unread');
        // 최신 3개만
        setUnreadPosts(res.data.slice(0, 3));
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnread();
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, alignItems: 'center' },
        ]}
      >
        <View style={{ width: contentWidth, gap: 28 }}>

          {/* ── 상단 프로필 영역 ── */}
          <View style={styles.topRow}>
            <View style={styles.greeting}>
              <Text style={styles.greetingText}>안녕하세요 👋</Text>
              <Text style={styles.greetingName}>{user?.name ?? ''}</Text>
            </View>

            {/* 프로필 아바타 → 프로필 화면으로 이동 */}
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── 안읽은 게시글 ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>안읽은 게시글</Text>
              {unreadPosts.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadPosts.length}</Text>
                </View>
              )}
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" style={{ marginTop: 16 }} />
            ) : unreadPosts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>읽지 않은 게시글이 없습니다 ✓</Text>
              </View>
            ) : (
              <View style={styles.postList}>
                {unreadPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => router.push(`/(tabs)/board/${post.id}`)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.postCardLeft}>
                      <View style={styles.unreadDot} />
                    </View>
                    <View style={styles.postCardContent}>
                      <Text style={styles.postTitle} numberOfLines={1}>
                        {post.title}
                      </Text>
                      <Text style={styles.postContents} numberOfLines={1}>
                        {post.contents}
                      </Text>
                      <View style={styles.postMeta}>
                        <Text style={styles.postWriter}>{post.writerName}</Text>
                        <Text style={styles.postDate}>{formatDate(post.createdDate)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── 게시판 바로가기 ── */}
          <TouchableOpacity
            style={styles.boardShortcut}
            onPress={() => router.push('/(tabs)/board')}
            activeOpacity={0.8}
          >
            <View style={styles.boardShortcutLeft}>
              <Text style={styles.boardShortcutTitle}>게시판</Text>
              <Text style={styles.boardShortcutDesc}>전체 게시글 보기</Text>
            </View>
            <Text style={styles.boardShortcutArrow}>→</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

// ─── 스타일 ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // 상단 프로필
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    gap: 2,
  },
  greetingText: {
    fontSize: 14,
    color: '#999999',
  },
  greetingName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // 섹션 공통
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  badge: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 빈 상태
  emptyBox: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },

  // 게시글 목록
  postList: {
    gap: 10,
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
  },
  postCardLeft: {
    paddingTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
  },
  postCardContent: {
    flex: 1,
    gap: 4,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  postContents: {
    fontSize: 13,
    color: '#666666',
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  postWriter: {
    fontSize: 12,
    color: '#999999',
  },
  postDate: {
    fontSize: 12,
    color: '#999999',
  },

  // 게시판 바로가기
  boardShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  boardShortcutLeft: {
    gap: 4,
  },
  boardShortcutTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  boardShortcutDesc: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  boardShortcutArrow: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});
