// 하트기도365 디자인 토큰
// Material 3의 색 역할(role) 개념을 따르되, 브랜드 색은 앱 로고에서 가져왔다.
// 로고: 빨강(왼쪽 하트) · 파랑(오른쪽 하트) · 보라(겹치는 가운데) → 보라를 주색으로 쓴다.

export const Palette = {
  // 주색: 로고 가운데 보라
  primary: '#6B2D6B',
  onPrimary: '#FFFFFF',
  primaryContainer: '#F3E4F3',
  onPrimaryContainer: '#3D1640',

  // 보조: 로고 파랑 — 정보성 표시(중보기도 등)
  secondary: '#5B8FD6',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E4EDFA',
  onSecondaryContainer: '#1D3F6B',

  // 강조: 로고 빨강 — 기도중/진행 상태
  accent: '#CE1126',
  accentContainer: '#FBE3E6',
  onAccentContainer: '#7A0A17',

  // 상태
  success: '#2E7D4F',
  successContainer: '#E3F2E9',
  onSuccessContainer: '#17492E',

  warning: '#B8752E',
  warningContainer: '#FBEEDC',
  onWarningContainer: '#6E4415',

  danger: '#C0392B',
  onDanger: '#FFFFFF',
  dangerContainer: '#FBE5E2',
  onDangerContainer: '#772016',

  // 중립
  background: '#FFFFFF',
  onBackground: '#1A1A1A',
  surface: '#FFFFFF',
  surfaceVariant: '#F6F4F7',
  surfaceContainer: '#FAF8FB',
  onSurface: '#1A1A1A',
  onSurfaceVariant: '#6B6570',
  outline: '#DCD7E0',
  outlineVariant: '#EDEAF0',

  disabled: '#B5B0BA',
  scrim: 'rgba(0, 0, 0, 0.42)',
} as const;

// 4pt 그리드
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// M3 shape scale
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// M3 type scale 중 이 앱에서 실제로 쓰는 것만
export const Type = {
  headlineLarge: { fontSize: 30, fontWeight: '700', lineHeight: 38 },
  headlineSmall: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  titleLarge: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  titleMedium: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  titleSmall: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 26 },
  bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 21 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  labelSmall: { fontSize: 11, fontWeight: '600', lineHeight: 15 },
} as const;

// 그림자 (안드로이드는 elevation, iOS/웹은 shadow*)
export const Elevation = {
  level0: {},
  level1: {
    elevation: 1,
    shadowColor: '#2A1B2E',
    shadowOpacity: 0.07,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  level2: {
    elevation: 3,
    shadowColor: '#2A1B2E',
    shadowOpacity: 0.11,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  level3: {
    elevation: 6,
    shadowColor: '#2A1B2E',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
} as const;

// 접근성: 터치 대상 최소 48dp (M3 권장)
export const MIN_TOUCH = 48;
