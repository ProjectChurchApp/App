// app/(tabs)/profile.tsx

import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, isLoading } = useAuth();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // 반응형: 최대 너비 제한
  const contentWidth = Math.min(width * 0.9, 440);
  const avatarSize = Math.min(width * 0.22, 96);
  const avatarFontSize = avatarSize * 0.4;

  const handleLogout = () => {
  console.log("로그아웃 실행 시도");

  const logoutConfirm = async () => {
    try {
      await logout();
    } catch {
      if (Platform.OS === 'web') {
        alert('로그아웃 중 오류가 발생했습니다.');
      } else {
        Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  if (Platform.OS === 'web') {
    // 웹 브라우저용 표준 confirm 사용
    if (window.confirm('정말 로그아웃 하시겠습니까?')) {
      logoutConfirm();
    }
  } else {
    // 모바일용 네이티브 Alert 사용
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: logoutConfirm },
      ]
    );
  }
};

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>사용자 정보를 불러올 수 없습니다.</Text>
      </View>
    );
  }

  const roleLabel = user.role === '목사' ? '목사' : '신도';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>프로필</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height - insets.top - insets.bottom - 70 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}>

        {/* 화면 중앙 정렬 래퍼 */}
        <View style={styles.centerWrapper}>
          <View style={[styles.card, { width: contentWidth }]}>
            {/* 아바타 영역 */}
            <View style={styles.userInfo}>
              <View
                style={[
                  styles.avatar,
                  {
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  },
                ]}>
                <Text style={[styles.avatarText, { fontSize: avatarFontSize }]}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.name, { fontSize: Math.min(width * 0.06, 24) }]}>
                {user.name}
              </Text>
              <Text style={styles.loginID}>@{user.loginID}</Text>

              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{roleLabel}</Text>
              </View>
            </View>

            {/* 로그아웃 버튼 */}
            <TouchableOpacity
              style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
              onPress={handleLogout}
              disabled={isLoading}
              activeOpacity={0.8}>
              <Text style={styles.logoutButtonText}>
                {isLoading ? '처리 중...' : '로그아웃'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center', // 수직 중앙
    alignItems: 'center',     // 수평 중앙
    paddingVertical: 40,
  },
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    gap: 40,
  },
  userInfo: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontWeight: 'bold',
    color: '#000000',
  },
  loginID: {
    fontSize: 16,
    color: '#666666',
  },
  roleBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 100,
  },
});