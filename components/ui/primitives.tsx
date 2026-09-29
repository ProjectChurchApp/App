// 앱 전반에서 재사용하는 UI 조각들.
// 세그먼트와 필터는 shadcn Tabs 구조를 따른다 — muted 트랙 위에 선택된 칸만 흰 캡슐로 떠오르고,
// 칸 사이에는 선이 없다.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  Elevation,
  ICON,
  ICON_SM,
  MIN_TOUCH,
  Palette,
  Radius,
  Spacing,
  Type,
} from '../../constants/design';
import type { ChipTone } from '../../constants/prayerMeta';

const ripple = (color: string, borderless = false, radius?: number) =>
  Platform.OS === 'android' ? { color, borderless, radius } : undefined;

const t = (style: (typeof Type)[keyof typeof Type]): TextStyle => ({
  fontSize: style.fontSize,
  fontWeight: style.fontWeight as TextStyle['fontWeight'],
  lineHeight: style.lineHeight,
  letterSpacing: style.letterSpacing,
});

/**
 * 탭바가 콘텐츠 위를 덮는 만큼의 높이.
 * iOS는 탭바를 absolute로 띄워 콘텐츠가 그 아래까지 흐르지만,
 * 안드로이드는 콘텐츠 영역이 이미 탭바 위에서 끝나므로 더할 필요가 없다.
 */
export function useTabBarOverlap() {
  const tabBarHeight = useBottomTabBarHeight();
  return Platform.OS === 'ios' ? tabBarHeight : 0;
}

// ─── 칩 ──────────────────────────────────────────────────
export function Chip({
  tone,
  style,
}: {
  tone: ChipTone;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }, style]}>
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
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;

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
  const off = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      android_ripple={ripple(v.ripple)}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border ?? 'transparent', borderWidth: v.border ? 1.5 : 0 },
        fullWidth && styles.buttonFull,
        off && styles.buttonDisabled,
        pressed && Platform.OS !== 'android' && styles.buttonPressed,
        style,
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={ICON_SM} color={v.fg} />}
      <Text style={[styles.buttonText, { color: v.fg }]} numberOfLines={1}>
        {loading ? '잠시만요...' : label}
      </Text>
    </Pressable>
  );
}

const BUTTON_VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border?: string; ripple: string }
> = {
  filled: { bg: Palette.primary, fg: Palette.onPrimary, ripple: 'rgba(255,255,255,0.22)' },
  tonal: { bg: Palette.primaryContainer, fg: Palette.onPrimaryContainer, ripple: 'rgba(107,45,107,0.14)' },
  outlined: { bg: 'transparent', fg: Palette.primary, border: Palette.outline, ripple: 'rgba(107,45,107,0.12)' },
  text: { bg: 'transparent', fg: Palette.onSurfaceVariant, ripple: 'rgba(107,45,107,0.12)' },
  danger: { bg: Palette.danger, fg: Palette.onDanger, ripple: 'rgba(255,255,255,0.22)' },
};

/** 화면 하단에 고정되는 주요 동작 버튼 */
export function BottomAction({
  label,
  icon,
  count,
  onPress,
}: {
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  count?: number;
  onPress: () => void;
}) {
  const overlap = useTabBarOverlap();
  return (
    <View style={[styles.bottomBar, { paddingBottom: overlap + Spacing.lg }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={count === undefined ? label : `${label}, 현재 ${count}회`}
        android_ripple={ripple('rgba(255,255,255,0.22)')}
        style={({ pressed }) => [
          styles.bottomButton,
          pressed && Platform.OS !== 'android' && { opacity: 0.9 },
        ]}
      >
        {icon && <MaterialCommunityIcons name={icon} size={ICON} color={Palette.onPrimary} />}
        <Text style={styles.bottomButtonText}>{label}</Text>
        {count !== undefined && (
          <View style={styles.bottomCount}>
            <Text style={styles.bottomCountText}>{count}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ─── FAB ─────────────────────────────────────────────────
export function FAB({
  onPress,
  label,
  icon = 'plus',
}: {
  onPress: () => void;
  label?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  const overlap = useTabBarOverlap();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ?? '새로 작성'}
      android_ripple={ripple('rgba(255,255,255,0.24)')}
      style={({ pressed }) => [
        styles.fab,
        { bottom: overlap + Spacing.lg },
        label ? styles.fabExtended : styles.fabRound,
        pressed && Platform.OS !== 'android' && { opacity: 0.9 },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={ICON} color={Palette.onPrimary} />
      {label && <Text style={styles.fabLabel}>{label}</Text>}
    </Pressable>
  );
}

// ─── 세그먼트 / 필터 (shadcn Tabs 구조) ──────────────────
type Segment<T extends string> = { value: T; label: string };

export function SegmentedButtons<T extends string>({
  options,
  value,
  onChange,
  disabled,
  style,
}: {
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.track, disabled && styles.trackDisabled, style]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: !!disabled }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
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

/** 목록 상단의 상태 필터. 세그먼트와 같은 모양을 쓰되 가로 스크롤을 허용한다. */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.filterScroll}>
      <View style={[styles.track, styles.filterTrack]}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.segment, styles.filterSegment, selected && styles.segmentSelected]}
            >
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
        <MaterialCommunityIcons name={icon} size={34} color={Palette.primary} />
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
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[style, { opacity, backgroundColor: Palette.track }]} />;
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

// ─── 헤더 / 아바타 / 아이콘 버튼 ─────────────────────────
export function ScreenHeader({
  title,
  subtitle,
  greeting,
  paddingTop,
  right,
}: {
  title: string;
  subtitle?: string;
  /** 제목 위에 얹는 인사말. 목록 첫 화면의 딱딱함을 덜어준다. */
  greeting?: string;
  paddingTop: number;
  right?: ReactNode;
}) {
  return (
    <View style={[styles.header, { paddingTop }]}>
      <View style={styles.headerText}>
        {greeting && <Text style={styles.headerGreeting}>{greeting}</Text>}
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

/** 현재 값을 보여주고 누르면 선택지가 뜨는 드롭다운. 고른 항목에는 체크가 붙는다. */
export function SelectMenu<T extends string>({
  label,
  options,
  value,
  onChange,
  tone,
  disabled,
}: {
  label: string;
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  tone?: { fg: string; bg: string };
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}, 현재 ${current?.label ?? ''}. 눌러서 변경`}
        android_ripple={ripple('rgba(107,45,107,0.15)')}
        style={({ pressed }) => [
          styles.selectTrigger,
          tone ? { backgroundColor: tone.bg } : null,
          (pressed || disabled) && { opacity: 0.7 },
        ]}
      >
        <Text style={[styles.selectTriggerText, tone ? { color: tone.fg } : null]}>
          {current?.label ?? label}
        </Text>
        <MaterialCommunityIcons
          name="chevron-down"
          size={18}
          color={tone?.fg ?? Palette.onSurfaceVariant}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.menuScrim} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.menuTitle}>{label}</Text>
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setOpen(false);
                    if (!selected) onChange(opt.value);
                  }}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  android_ripple={ripple('rgba(107,45,107,0.12)')}
                  style={styles.menuItem}
                >
                  <Text style={[styles.menuItemText, selected && styles.menuItemTextSelected]}>
                    {opt.label}
                  </Text>
                  {selected && (
                    <MaterialCommunityIcons name="check" size={20} color={Palette.primary} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function Avatar({
  name,
  size = 40,
  onPress,
}: {
  name?: string;
  size?: number;
  onPress?: () => void;
}) {
  const initial = name?.charAt(0).toUpperCase() ?? '?';
  const content = (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="프로필"
      hitSlop={10}
      style={({ pressed }) =>
        pressed && Platform.OS !== 'android' ? { opacity: 0.7 } : undefined
      }
    >
      {content}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  tone = Palette.onSurfaceVariant,
  size = ICON,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={ripple('rgba(107,45,107,0.15)', true, 24)}
      style={({ pressed }) => [styles.iconButton, (pressed || disabled) && { opacity: 0.55 }]}
    >
      <MaterialCommunityIcons name={icon} size={size} color={tone} />
    </Pressable>
  );
}

/** 구역을 나누는 얇은 선. 테두리가 아니라 경계 암시용이다. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  chipText: { ...t(Type.labelSmall) },

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

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
  },
  buttonFull: { alignSelf: 'stretch' },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { ...t(Type.titleSmall) },

  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Palette.surface,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Palette.primary,
    overflow: 'hidden',
    ...Elevation.level3,
  },
  bottomButtonText: { ...t(Type.titleMedium), color: Palette.onPrimary },
  bottomCount: {
    minWidth: 30,
    height: 28,
    paddingHorizontal: 9,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCountText: { ...t(Type.label), color: Palette.onPrimary, fontWeight: '700' },

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
  fabExtended: { height: 56, paddingHorizontal: Spacing.xl, borderRadius: Radius.lg, gap: Spacing.sm },
  fabLabel: { ...t(Type.titleSmall), color: Palette.onPrimary },

  // 세그먼트 — 트랙 위에 캡슐
  track: {
    flexDirection: 'row',
    backgroundColor: Palette.track,
    borderRadius: Radius.md,
    padding: 3,
    gap: 3,
  },
  trackDisabled: { opacity: 0.5 },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    borderRadius: 9,
  },
  segmentSelected: {
    backgroundColor: Palette.surface,
    ...Elevation.raised,
  },
  segmentText: { ...t(Type.label), color: Palette.onSurfaceVariant },
  segmentTextSelected: { color: Palette.primary, fontWeight: '700' },

  filterScroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  filterTrack: { alignSelf: 'flex-start' },
  filterSegment: { flex: 0, minWidth: 64, paddingHorizontal: Spacing.lg },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: { ...t(Type.titleMedium), color: Palette.onSurface, textAlign: 'center' },
  emptyDesc: { ...t(Type.bodyMedium), color: Palette.onSurfaceVariant, textAlign: 'center' },
  emptyAction: { marginTop: Spacing.sm },

  skeletonWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: Spacing.md },
  skelTitle: { height: 18, width: '62%', borderRadius: Radius.xs },
  skelLine: { height: 13, width: '100%', borderRadius: Radius.xs },
  skelLineShort: { height: 13, width: '76%', borderRadius: Radius.xs },
  skelFooter: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  skelChip: { height: 22, width: 68, borderRadius: Radius.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerText: { flexShrink: 1 },
  headerTitle: { ...t(Type.headlineSmall), color: Palette.onSurface },
  headerSubtitle: { ...t(Type.bodySmall), color: Palette.onSurfaceVariant, marginTop: 2 },
  headerGreeting: { ...t(Type.label), color: Palette.primary, marginBottom: 2 },

  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    borderRadius: Radius.sm,
    backgroundColor: Palette.track,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  selectTriggerText: { ...t(Type.label), color: Palette.onSurfaceVariant },

  menuScrim: {
    flex: 1,
    backgroundColor: Palette.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  menu: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    ...Elevation.level3,
  },
  menuTitle: {
    ...t(Type.labelSmall),
    color: Palette.onSurfaceVariant,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH,
    paddingHorizontal: Spacing.xl,
  },
  menuItemText: { ...t(Type.bodyLarge), color: Palette.onSurface },
  menuItemTextSelected: { color: Palette.primary, fontWeight: '700' },

  avatar: {
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: Palette.onPrimary, fontWeight: '700' },

  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },

  divider: { height: 1, backgroundColor: Palette.outlineVariant },
  sectionLabel: { ...t(Type.label), color: Palette.onSurfaceVariant },
});
