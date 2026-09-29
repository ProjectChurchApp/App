// 앱 전역의 알림(스낵바)과 확인창(다이얼로그).
// 기존에는 화면마다 Platform.OS === 'web' ? window.alert : Alert.alert 분기를 반복했는데,
// 여기로 모으면 분기가 사라지고 웹/네이티브가 같은 모습으로 동작한다.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Elevation, Palette, Radius, Spacing, Type } from '../../constants/design';
import { AppButton } from './primitives';

type ToastTone = 'info' | 'success' | 'error';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type FeedbackApi = {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback은 FeedbackProvider 안에서만 쓸 수 있습니다.');
  return ctx;
}

/** 서버 오류를 사람이 읽을 수 있는 문장으로 바꾼다. */
export function errorMessage(e: any, fallback = '오류가 발생했습니다.'): string {
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

const TONE_STYLE: Record<ToastTone, { bg: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  info: { bg: '#2E2A33', icon: 'information-outline' },
  success: { bg: Palette.success, icon: 'check-circle-outline' },
  error: { bg: Palette.danger, icon: 'alert-circle-outline' },
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  const [toastState, setToastState] = useState<{ message: string; tone: ToastTone } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToastState({ message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(
          ({ finished }) => finished && setToastState(null)
        );
      }, 3200);
    },
    [opacity]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((ok: boolean) => {
    setConfirmState(null);
    resolverRef.current?.(ok);
    resolverRef.current = null;
  }, []);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={api}>
      {children}

      {toastState && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.toastWrap, { bottom: insets.bottom + 72, opacity }]}
        >
          <View style={[styles.toast, { backgroundColor: TONE_STYLE[toastState.tone].bg }]}>
            <MaterialCommunityIcons
              name={TONE_STYLE[toastState.tone].icon}
              size={19}
              color="#FFFFFF"
            />
            <Text style={styles.toastText}>{toastState.message}</Text>
          </View>
        </Animated.View>
      )}

      <Modal
        visible={!!confirmState}
        transparent
        animationType="fade"
        onRequestClose={() => settle(false)}
      >
        <Pressable style={styles.scrim} onPress={() => settle(false)}>
          <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.dialogTitle}>{confirmState?.title}</Text>
            {confirmState?.message && (
              <Text style={styles.dialogMessage}>{confirmState.message}</Text>
            )}
            <View style={styles.dialogActions}>
              <AppButton
                label={confirmState?.cancelLabel ?? '취소'}
                variant="text"
                onPress={() => settle(false)}
              />
              <AppButton
                label={confirmState?.confirmLabel ?? '확인'}
                variant={confirmState?.destructive ? 'danger' : 'filled'}
                onPress={() => settle(true)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </FeedbackContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    maxWidth: 560,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    ...Elevation.level3,
  },
  toastText: {
    flex: 1,
    fontSize: Type.bodyMedium.fontSize,
    lineHeight: Type.bodyMedium.lineHeight,
    color: '#FFFFFF',
  },

  scrim: {
    flex: 1,
    backgroundColor: Palette.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Palette.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    gap: Spacing.md,
    ...Elevation.level3,
  },
  dialogTitle: {
    fontSize: Type.titleLarge.fontSize,
    fontWeight: Type.titleLarge.fontWeight,
    lineHeight: Type.titleLarge.lineHeight,
    color: Palette.onSurface,
  },
  dialogMessage: {
    fontSize: Type.bodyMedium.fontSize,
    lineHeight: 22,
    color: Palette.onSurfaceVariant,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
});
