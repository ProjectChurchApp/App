// 앱 전반에서 재사용하는 UI 조각들.
// Material 3의 패턴(칩, 카드, FAB, 세그먼트 버튼)을 따르되 앱의 기존 톤을 유지한다.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Elevation, MIN_TOUCH, Palette, Radius, Spacing, Type } from '../../constants/design';
import type { ChipTone } from '../../constants/prayerMeta';

const ripple = (color: string) => (Platform.OS === 'android' ? { color, borderless: false } : undefined);

// ─── 칩 ──────────────────────────────────────────────────
export function Chip({
  tone,
  icon,
  style,
}: {
  tone: ChipTone;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }, style]}>
      {icon && <MaterialCommunityIcons name={icon} size={13} color={tone.fg} />}
      <Text style={[styles.chipText, { color: tone.fg }]} numberOfLines={1}>
        {tone.label}
      </Text>
    </View>
  );
}

// ─── 카드 ────────────────────────────────────────────────
export function SurfaceCard({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      android_ripple={ripple(Palette.primaryContainer)}
      style={({ pressed }) => [
        styles.card,
        pressed && Platform.OS !== 'android' && styles.cardPressed,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

// ─── 버튼 ────────────────────────────────────────────────
type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

export function AppButton({
  label,
  onPress,
  variant = 'filled',
  icon,
  disabled,
  loading,
  fullWidth,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BUTTON_VARIANTS[variant];
  const isOff = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isOff }}
      android_ripple={ripple(v.rippleColor)}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1.5 : 0 },
        fullWidth && styles.buttonFull,
        isOff && styles.buttonDisabled,
        pressed && Platform.OS !== 'android' && styles.buttonPressed,
        style,
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={18} color={v.fg} />}
      <Text style={[styles.buttonText, { color: v.fg }]} numberOfLines={1}>
        {loading ? '처리 중...' : label}
      </Text>
    </Pressable>
  );
}

const BUTTON_VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string; rippleColor: string }
> = {
  filled: { bg: Palette.primary, fg: Palette.onPrimary, rippleColor: 'rgba(255,255,255,0.22)' },
  tonal: { bg: Palette.primaryContainer, fg: Palette.onPrimaryContainer, rippleColor: 'rgba(107,45,107,0.15)' },
  outlined: { bg: 'transparent', fg: Palette.primary, border: Palette.outline, rippleColor: 'rgba(107,45,107,0.12)' },
  text: { bg: 'transparent', fg: Palette.onSurfaceVariant, rippleColor: 'rgba(107,45,107,0.12)' },
  danger: { bg: Palette.danger, fg: Palette.onDanger, rippleColor: 'rgba(255,255,255,0.22)' },
};

// ─── FAB ─────────────────────────────────────────────────
export function FAB({
  onPress,
  label,
  icon = 'plus',
  bottom,
}: {
  onPress: () => void;
  label?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  bottom: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? '새로 작성'}
      android_ripple={ripple('rgba(255,255,255,0.24)')}
      style={({ pressed }) => [
        styles.fab,
        { bottom: bottom + Spacing.lg },
        label ? styles.fabExtended : styles.fabRound,
        pressed && Platform.OS !== 'android' && styles.fabPressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={Palette.onPrimary} />
      {label && <Text style={styles.fabLabel}>{label}</Text>}
    </Pressable>
  );
}

// ─── 세그먼트 버튼 ───────────────────────────────────────
export function SegmentedButtons<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.segmentRow, disabled && styles.segmentDisabled]}>
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: !!disabled }}
            android_ripple={ripple('rgba(107,45,107,0.15)')}
            style={[
              styles.segment,
              i === 0 && styles.segmentFirst,
              i === options.length - 1 && styles.segmentLast,
              selected && styles.segmentSelected,
            ]}
          >
            {selected && (
              <MaterialCommunityIcons name="check" size={15} color={Palette.onPrimaryContainer} />
            )}
            <Text
              style={[styles.segmentText, selected && styles.segmentTextSelected]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── 빈 상태 ─────────────────────────────────────────────
export function EmptyState({
  icon = 'inbox-outline',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <MaterialCommunityIcons name={icon} size={38} color={Palette.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {actionLabel && onAction && (
        <AppButton label={actionLabel} onPress={onAction} variant="tonal" style={styles.emptyAction} />
      )}
    </View>
  );
}

// ─── 스켈레톤 ────────────────────────────────────────────
function Pulse({ style }: { style: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 720, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 720, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity, backgroundColor: Palette.outlineVariant }]} />;
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.card}>
          <Pulse style={styles.skelTitle} />
          <Pulse style={styles.skelLine} />
          <Pulse style={styles.skelLineShort} />
          <View style={styles.skelFooter}>
            <Pulse style={styles.skelChip} />
            <Pulse style={styles.skelChip} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── 화면 헤더 ───────────────────────────────────────────
export function ScreenHeader({
  title,
  subtitle,
  paddingTop,
  right,
}: {
  title: string;
  subtitle?: string;
  paddingTop: number;
  right?: ReactNode;
}) {
  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Avatar({ name, onPress }: { name?: string; onPress?: () => void }) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  const content = (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="프로필"
      hitSlop={10}
      style={({ pressed }) => pressed && Platform.OS !== 'android' ? { opacity: 0.7 } : undefined}
    >
      {content}
    </Pressable>
  );
}

const textStyle = (t: typeof Type[keyof typeof Type]): TextStyle => ({
  fontSize: t.fontSize,
  fontWeight: t.fontWeight as TextStyle['fontWeight'],
  lineHeight: t.lineHeight,
});

const styles = StyleSheet.create({
  // 칩
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  chipText: { ...textStyle(Type.labelSmall) },

  // 카드
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    ...Elevation.level1,
  },
  cardPressed: { backgroundColor: Palette.surfaceContainer },

  // 버튼
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  buttonFull: { alignSelf: 'stretch' },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { ...textStyle(Type.titleSmall) },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    ...Elevation.level3,
  },
  fabRound: { width: 56, height: 56, borderRadius: Radius.lg },
  fabExtended: {
    height: 56,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  fabPressed: { opacity: 0.9 },
  fabLabel: { ...textStyle(Type.titleSmall), color: Palette.onPrimary },

  // 세그먼트
  segmentRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Palette.outline,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  segmentDisabled: { opacity: 0.5 },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 42,
    paddingHorizontal: Spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: Palette.outline,
  },
  segmentFirst: { borderLeftWidth: 0 },
  segmentLast: {},
  segmentSelected: { backgroundColor: Palette.primaryContainer },
  segmentText: { ...textStyle(Type.label), color: Palette.onSurfaceVariant },
  segmentTextSelected: { color: Palette.onPrimaryContainer },

  // 빈 상태
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: { ...textStyle(Type.titleMedium), color: Palette.onSurface, textAlign: 'center' },
  emptyDesc: {
    ...textStyle(Type.bodyMedium),
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyAction: { marginTop: Spacing.sm },

  // 스켈레톤
  skeletonWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.md },
  skelTitle: { height: 18, width: '62%', borderRadius: Radius.xs },
  skelLine: { height: 13, width: '100%', borderRadius: Radius.xs },
  skelLineShort: { height: 13, width: '76%', borderRadius: Radius.xs },
  skelFooter: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  skelChip: { height: 22, width: 68, borderRadius: Radius.sm },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerText: { flexShrink: 1 },
  headerTitle: { ...textStyle(Type.headlineSmall), color: Palette.onSurface },
  headerSubtitle: { ...textStyle(Type.bodySmall), color: Palette.onSurfaceVariant, marginTop: 2 },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { ...textStyle(Type.titleSmall), color: Palette.onPrimary },
});
