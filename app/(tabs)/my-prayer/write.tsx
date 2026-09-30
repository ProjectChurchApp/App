// app/(tabs)/my-prayer/write.tsx

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage, useFeedback } from '../../../components/ui/Feedback';
import { AppButton } from '../../../components/ui/primitives';
import { Palette, Radius, Spacing, Type } from '../../../constants/design';
import { useAuth } from '../../../contexts/AuthContext';
import { Connection } from '../../../types/connection';
import { api } from '../../../utils/api';

type VisibilityChoice = 'PRIVATE' | 'PASTOR_ONLY' | 'INTERCESSORY';

const VISIBILITY_OPTIONS: {
  key: VisibilityChoice;
  label: string;
  desc: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  needsPastor: boolean;
}[] = [
  {
    key: 'PRIVATE',
    label: '나만보기',
    desc: '나만 볼 수 있어요. 개인적인 기도 기록으로 사용하세요.',
    icon: 'lock-outline',
    needsPastor: false,
  },
  {
    key: 'PASTOR_ONLY',
    label: '목사님만 기도',
    desc: '연결된 목사님만 보고 함께 기도해요. 게시판에는 올라가지 않습니다.',
    icon: 'account-heart-outline',
    needsPastor: true,
  },
  {
    key: 'INTERCESSORY',
    label: '중보기도',
    desc: '목사님이 확인한 뒤 중보기도 게시판에 공유해요. 같은 목사님과 연결된 성도들이 함께 기도합니다.',
    icon: 'bullhorn-outline',
    needsPastor: true,
  },
];

export default function MyPrayerWriteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [contents, setContents] = useState('');
  const [choice, setChoice] = useState<VisibilityChoice>('PRIVATE');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [writerLoginID, setWriterLoginID] = useState<string | null>(null);
  const [isPromoted, setIsPromoted] = useState(false);

  const contentWidth = Math.min(width * 0.95, 680);
  const hasApprovedPastor = connection?.status === 'APPROVED';

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

  const handleSelectChoice = async (option: (typeof VISIBILITY_OPTIONS)[number]) => {
    if (option.needsPastor && !hasApprovedPastor) {
      const ok = await confirm({
        title: '먼저 목사님과 연결해주세요',
        message: '목사님께 기도를 전하려면 연결이 필요합니다. 지금 연결 화면으로 이동할까요?',
        confirmLabel: '연결하기',
      });
      if (ok) router.push('/(tabs)/connect' as any);
      return;
    }
    setChoice(option.key);
  };

  useEffect(() => {
    if (!isEditMode) return;

    const fetchExisting = async () => {
      try {
        const res = await api.get(`/prayer/${id}`);
        setTitle(res.data.title);
        setContents(res.data.contents);
        setWriterLoginID(res.data.writerLoginID);
        setIsPromoted(res.data.boardStage === 'INTERCESSORY');
        setChoice(
          res.data.visibility === 'PRIVATE'
            ? 'PRIVATE'
            : res.data.intercessoryRequested
              ? 'INTERCESSORY'
              : 'PASTOR_ONLY'
        );
      } catch (e: any) {
        toast(errorMessage(e), 'error');
        router.back();
      } finally {
        setIsFetching(false);
      }
    };

    fetchExisting();
  }, [id]);

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

    const payload = {
      title: title.trim(),
      contents: contents.trim(),
      visibility: choice === 'PRIVATE' ? 'PRIVATE' : 'PASTOR',
      intercessoryRequested: choice === 'INTERCESSORY',
    };

    try {
      if (isEditMode) {
        await api.put(`/prayer/${id}`, payload);
        toast('수정했습니다.', 'success');
      } else {
        await api.post('/prayer', payload);
        toast('기도를 등록했습니다.', 'success');
      }
      router.back();
    } catch (e: any) {
      toast(errorMessage(e), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 공개 범위를 고를 수 있는 경우:
  //  - 새 글이거나 내가 쓴 글이고 (목사님이 성도 글을 다듬을 때는 못 바꾼다)
  //  - 아직 중보기도로 올라가지 않았을 때.
  //    이미 올라간 글을 되돌리면 함께 기도하던 사람들 화면에서 사라지므로 잠근다.
  const isOwnPrayer = !isEditMode || writerLoginID === null || writerLoginID === user?.loginID;
  const canChooseVisibility = isOwnPrayer && !isPromoted;

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
      {/* 상단 바 */}
      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="취소"
          android_ripple={{ color: 'rgba(107,45,107,0.15)', borderless: true, radius: 22 }}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons name="close" size={22} color={Palette.onSurfaceVariant} />
        </Pressable>

        <Text style={styles.appBarTitle}>{isEditMode ? '기도 요청 수정' : '기도 요청 작성'}</Text>

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
          {/* 공개 범위 */}
          {isPromoted && (
            <View style={styles.hint}>
              <MaterialCommunityIcons
                name="bullhorn-outline"
                size={15}
                color={Palette.onWarningContainer}
              />
              <Text style={styles.hintText}>
                중보기도 게시판에 올라간 기도예요. 공개 범위는 바꿀 수 없고, 제목과 내용만 고칠 수 있어요.
              </Text>
            </View>
          )}

          {canChooseVisibility && (
          <View style={styles.field}>
            <Text style={styles.label}>공개 범위</Text>

            <View style={styles.options}>
              {VISIBILITY_OPTIONS.map((option) => {
                const selected = choice === option.key;
                const locked = option.needsPastor && !hasApprovedPastor;

                return (
                  <Pressable
                    key={option.key}
                    onPress={() => handleSelectChoice(option)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: locked }}
                    android_ripple={{ color: 'rgba(107,45,107,0.12)' }}
                    style={[
                      styles.option,
                      selected && styles.optionSelected,
                      locked && styles.optionLocked,
                    ]}
                  >
                    <View style={styles.optionHead}>
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={18}
                        color={selected ? Palette.onPrimaryContainer : Palette.onSurfaceVariant}
                      />
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {option.label}
                      </Text>
                      {locked && (
                        <MaterialCommunityIcons
                          name="lock-outline"
                          size={15}
                          color={Palette.disabled}
                        />
                      )}
                      {selected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={18}
                          color={Palette.primary}
                          style={styles.optionCheck}
                        />
                      )}
                    </View>
                    <Text style={styles.optionDesc}>{option.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            {!hasApprovedPastor && (
              <View style={styles.hint}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={15}
                  color={Palette.onWarningContainer}
                />
                <Text style={styles.hintText}>
                  아직 연결된 목사님이 없어요. 프로필에서 먼저 연결해주세요.
                </Text>
              </View>
            )}
          </View>
          )}

          {/* 제목 */}
          <View style={styles.field}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="무엇을 위해 기도하시나요?"
              placeholderTextColor={Palette.disabled}
              maxLength={100}
              returnKeyType="next"
              editable={!isLoading}
            />
            <Text style={styles.charCount}>{title.length} / 100</Text>
          </View>

          {/* 내용 */}
          <View style={styles.field}>
            <Text style={styles.label}>내용</Text>
            <TextInput
              style={styles.contentsInput}
              value={contents}
              onChangeText={setContents}
              placeholder="기도 내용을 자유롭게 적어보세요."
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
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
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
  label: {
    fontSize: Type.label.fontSize,
    fontWeight: Type.label.fontWeight,
    color: Palette.onSurfaceVariant,
    letterSpacing: 0.4,
  },

  // 공개 범위
  options: { gap: Spacing.sm },
  option: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.outline,
    backgroundColor: Palette.surface,
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  optionSelected: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryContainer,
  },
  optionLocked: { opacity: 0.6 },
  optionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionLabel: {
    fontSize: Type.titleSmall.fontSize,
    fontWeight: '700',
    color: Palette.onSurface,
  },
  optionLabelSelected: { color: Palette.onPrimaryContainer },
  optionCheck: { marginLeft: 'auto' },
  optionDesc: {
    fontSize: Type.labelSmall.fontSize,
    lineHeight: 18,
    color: Palette.onSurfaceVariant,
  },

  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    backgroundColor: Palette.warningContainer,
  },
  hintText: {
    flex: 1,
    fontSize: Type.labelSmall.fontSize,
    lineHeight: 18,
    color: Palette.onWarningContainer,
  },

  titleInput: {
    fontSize: Type.titleLarge.fontSize,
    fontWeight: '600',
    color: Palette.onSurface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: Palette.outlineVariant,
  },
  charCount: {
    fontSize: Type.labelSmall.fontSize,
    color: Palette.disabled,
    textAlign: 'right',
  },
  contentsInput: {
    fontSize: Type.bodyLarge.fontSize,
    color: Palette.onSurface,
    lineHeight: Type.bodyLarge.lineHeight,
    minHeight: 260,
    paddingTop: Spacing.xs,
  },
});
