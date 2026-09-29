// app/(tabs)/board/write.tsx

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import { AppButton, IconButton, SectionLabel } from '../../../components/ui/primitives';
import { Palette, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../utils/api';

export default function BoardWriteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useFeedback();

  const isPastor = user?.role === '목사';

  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  const contentWidth = Math.min(width * 0.95, 680);

  useEffect(() => {
    if (!isPastor) {
      toast('게시글은 목사님만 작성할 수 있어요.', 'error');
      router.back();
    }
  }, [isPastor]);

  useEffect(() => {
    if (!isEditMode || !isPastor) return;

    const fetchExisting = async () => {
      try {
        const res = await api.get(`/board/${id}`);
        setTitle(res.data.title);
        setContents(res.data.contents);
      } catch (e: any) {
        toast(errorMessage(e), 'error');
        router.back();
      } finally {
        setIsFetching(false);
      }
    };

    fetchExisting();
  }, [id, isPastor]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast('제목을 입력해주세요.', 'error');
      return;
    }
    if (!contents.trim()) {
      toast('내용을 입력해주세요.', 'error');
      return;
    }

    setIsLoading(true);
    const payload = { title: title.trim(), contents: contents.trim() };

    try {
      if (isEditMode) {
        await api.put(`/board/${id}`, payload);
        toast('수정했어요.', 'success');
      } else {
        await api.post('/board/write', payload);
        toast('게시글을 올렸어요.', 'success');
      }
      router.back();
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPastor) return null;

  if (isFetching) {
    return (
      <View style={[styles.container, styles.centerBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.sm }]}>
        <IconButton icon="close" label="취소" onPress={() => router.back()} />
        <Text style={styles.appBarTitle}>{isEditMode ? '게시글 수정' : '게시글 작성'}</Text>
        <AppButton
          label={isEditMode ? '수정' : '등록'}
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.form, { width: contentWidth }]}>
          <View style={styles.field}>
            <SectionLabel>제목</SectionLabel>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="성도들에게 전할 소식을 적어주세요"
              placeholderTextColor={Palette.disabled}
              maxLength={100}
              returnKeyType="next"
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{title.length} / 100</Text>
          </View>

          <View style={styles.field}>
            <SectionLabel>내용</SectionLabel>
            <TextInput
              style={styles.contentsInput}
              value={contents}
              onChangeText={setContents}
              placeholder="내용을 입력해주세요."
              placeholderTextColor={Palette.disabled}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.background },
  centerBox: { alignItems: 'center', justifyContent: 'center' },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.outlineVariant,
  },
  appBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Type.titleMedium.fontSize,
    fontWeight: Type.titleMedium.fontWeight,
    color: Palette.onSurface,
  },
  submitButton: { paddingHorizontal: Spacing.lg, minHeight: 40 },

  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  form: { gap: Spacing.xxl },
  field: { gap: Spacing.sm },

  titleInput: {
    fontSize: Type.titleLarge.fontSize,
    fontWeight: '600',
    color: Palette.onSurface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: Palette.outlineVariant,
  },
  charCount: { fontSize: Type.labelSmall.fontSize, color: Palette.disabled, textAlign: 'right' },
  contentsInput: {
    fontSize: Type.reading.fontSize,
    lineHeight: Type.reading.lineHeight,
    color: Palette.onSurface,
    minHeight: 280,
    paddingTop: Spacing.xs,
  },
});
