// app/(tabs)/prayer/write.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Connection } from '../../../types/connection';
import { api } from '../../../utils/api';

export default function PrayerWriteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PASTOR'>('PRIVATE');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [connection, setConnection] = useState<Connection | null>(null);

  const contentWidth = Math.min(width * 0.95, 680);
  const hasApprovedPastor = connection?.status === 'APPROVED';

  // ── 연결된 목사님 확인 ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Connection | null>('/connections/me');
        setConnection(res.data);
      } catch {
        setConnection(null);
      }
    })();
  }, []);

  const handleSelectPastorVisibility = () => {
    if (!hasApprovedPastor) {
      const msg = '먼저 목사님과 연결해주세요.';
      if (Platform.OS === 'web') {
        if (window.confirm(msg + ' 지금 연결 화면으로 이동할까요?')) {
          router.push('/(tabs)/profile/connect' as any);
        }
      } else {
        Alert.alert('안내', msg, [
          { text: '취소', style: 'cancel' },
          { text: '연결하기', onPress: () => router.push('/(tabs)/profile/connect' as any) },
        ]);
      }
      return;
    }
    setVisibility('PASTOR');
  };

  // ── 수정 모드: 기존 내용 불러오기 ─────────────────────
  useEffect(() => {
    if (!isEditMode) return;

    const fetchExisting = async () => {
      try {
        const res = await api.get(`/prayer/${id}`);
        setTitle(res.data.title);
        setContents(res.data.contents);
        setVisibility(res.data.visibility);
      } catch (e: any) {
        const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
        if (Platform.OS === 'web') {
          window.alert(msg);
          router.back();
        } else {
          Alert.alert('오류', msg, [{ text: '확인', onPress: () => router.back() }]);
        }
      } finally {
        setIsFetching(false);
      }
    };

    fetchExisting();
  }, [id]);

  // ── 유효성 검사 ───────────────────────────────────────
  const validate = () => {
    if (!title.trim()) {
      const msg = '제목을 입력해주세요.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('알림', msg);
      return false;
    }
    if (!contents.trim()) {
      const msg = '내용을 입력해주세요.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('알림', msg);
      return false;
    }
    return true;
  };

  // ── 제출 ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      if (isEditMode) {
        await api.put(`/prayer/${id}`, {
          title: title.trim(),
          contents: contents.trim(),
          visibility,
        });
      } else {
        await api.post('/prayer', {
          title: title.trim(),
          contents: contents.trim(),
          visibility,
        });
      }
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? '오류가 발생했습니다.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('오류', msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEditMode ? '기도 요청 수정' : '기도 요청 작성'}
        </Text>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? '처리 중...' : isEditMode ? '수정' : '등록'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 폼 */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.formWrapper, { width: contentWidth }]}>

          {/* 공개 범위 선택 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>공개 범위</Text>
            <View style={styles.visibilityRow}>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  visibility === 'PRIVATE' && styles.visibilityButtonActive,
                ]}
                onPress={() => setVisibility('PRIVATE')}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.visibilityButtonText,
                  visibility === 'PRIVATE' && styles.visibilityButtonTextActive,
                ]}>
                  🔒 나만보기
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  visibility === 'PASTOR' && styles.visibilityButtonActive,
                ]}
                onPress={handleSelectPastorVisibility}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.visibilityButtonText,
                  visibility === 'PASTOR' && styles.visibilityButtonTextActive,
                ]}>
                  🙏 목사님께
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.visibilityDesc}>
              {visibility === 'PRIVATE'
                ? '나만 볼 수 있어요. 개인적인 기도 기록으로 사용하세요.'
                : '목사님께 기도 요청을 전달해요. 목사님께 알림이 전송됩니다.'}
            </Text>
            {!hasApprovedPastor && (
              <Text style={styles.visibilityHint}>
                아직 연결된 목사님이 없어요. 프로필에서 먼저 연결해주세요.
              </Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* 제목 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력하세요"
              placeholderTextColor="#AAAAAA"
              maxLength={100}
              returnKeyType="next"
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{title.length} / 100</Text>
          </View>

          <View style={styles.divider} />

          {/* 내용 */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>내용</Text>
            <TextInput
              style={styles.contentsInput}
              value={contents}
              onChangeText={setContents}
              placeholder="기도 내용을 입력하세요"
              placeholderTextColor="#AAAAAA"
              multiline
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cancelText: { fontSize: 16, color: '#666666', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000000' },
  submitButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  formWrapper: { gap: 16 },
  fieldGroup: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // 공개 범위
  visibilityRow: { flexDirection: 'row', gap: 10 },
  visibilityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  visibilityButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  visibilityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  visibilityButtonTextActive: {
    color: '#FFFFFF',
  },
  visibilityDesc: {
    fontSize: 12,
    color: '#999999',
    lineHeight: 18,
  },
  visibilityHint: {
    fontSize: 12,
    color: '#B8752E',
    lineHeight: 18,
  },

  divider: { height: 1, backgroundColor: '#EEEEEE' },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    paddingVertical: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EEEEEE',
  },
  charCount: { fontSize: 12, color: '#BBBBBB', textAlign: 'right' },
  contentsInput: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 26,
    minHeight: 300,
    paddingTop: 4,
  },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});