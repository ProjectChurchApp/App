// 하트기도365 디자인 토큰
//
// 색 역할은 Material 3, 컴포넌트 표현은 shadcn/ui(muted 트랙 + 떠오르는 캡슐),
// 여백과 타이포 기준은 토스 UX 가이드(아이콘 24px 이상, 360px 기준 해상도)를 따른다.
// 브랜드 색은 앱 로고에서 가져왔다. 로고 가운데 겹치는 보라가 주색이다.

export const Palette = {
  // 주색
  primary: '#6B2D6B',
  onPrimary: '#FFFFFF',
  primaryContainer: '#F6EDF6',
  onPrimaryContainer: '#4A1B4C',

  // 보조 — 로고 파랑. 중보기도 같은 정보성 표시에 쓴다.
  secondary: '#3F6FB5',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E9F0FA',
  onSecondaryContainer: '#1D3F6B',

  // 강조 — 로고 빨강. 기도중(진행) 상태.
  accent: '#CE1126',
  accentContainer: '#FCE9EB',
  onAccentContainer: '#8C1220',

  // 상태
  success: '#2E7D4F',
  successContainer: '#E7F3EC',
  onSuccessContainer: '#1B5335',

  warning: '#B8752E',
  warningContainer: '#FBF1E1',
  onWarningContainer: '#7A4D18',

  danger: '#C0392B',
  onDanger: '#FFFFFF',
  dangerContainer: '#FCEAE8',
  onDangerContainer: '#8A2318',

  // 중립 — 순회색 대신 보라 기운을 아주 살짝 섞어 브랜드와 붙인다.
  background: '#FFFFFF',
  onBackground: '#16141A',
  surface: '#FFFFFF',
  surfaceVariant: '#F7F5F8',
  surfaceContainer: '#FBFAFC',
  onSurface: '#16141A',
  onSurfaceVariant: '#7A7482',

  /** 세그먼트·칩의 바닥이 되는 트랙 (shadcn bg-muted 대응) */
  track: '#F1EFF4',

  outline: '#DFDBE4',
  /** 구역을 나누는 얇은 선. 테두리가 아니라 경계 암시용이다. */
  outlineVariant: '#F0EEF3',

  disabled: '#B5B0BA',
  scrim: 'rgba(18, 16, 22, 0.45)',
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

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

// 큰 제목일수록 자간을 좁혀야 한글이 덩어리로 읽힌다.
export const Type = {
  headlineLarge: { fontSize: 30, fontWeight: '700', lineHeight: 40, letterSpacing: -0.7 },
  headlineSmall: { fontSize: 26, fontWeight: '700', lineHeight: 35, letterSpacing: -0.55 },
  titleLarge: { fontSize: 20, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 },
  titleMedium: { fontSize: 17, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2 },
  titleSmall: { fontSize: 15, fontWeight: '600', lineHeight: 21, letterSpacing: -0.1 },
  /** 기도문·게시글 본문. 천천히 읽는 글이라 행간을 넉넉히 둔다. */
  reading: { fontSize: 17, fontWeight: '400', lineHeight: 30, letterSpacing: -0.1 },
  bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 26, letterSpacing: -0.1 },
  bodyMedium: { fontSize: 15, fontWeight: '400', lineHeight: 23, letterSpacing: 0 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 19, letterSpacing: 0 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18, letterSpacing: 0 },
  labelSmall: { fontSize: 12, fontWeight: '600', lineHeight: 16, letterSpacing: 0 },
} as const;

export const Elevation = {
  level0: {},
  /** 목록 카드 */
  level1: {
    elevation: 1,
    shadowColor: '#16141A',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  /** 세그먼트에서 선택된 캡슐. 떠 있는 느낌만 내고 그림자는 거의 안 보이게. */
  raised: {
    elevation: 2,
    shadowColor: '#16141A',
    shadowOpacity: 0.09,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  level2: {
    elevation: 3,
    shadowColor: '#16141A',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  /** FAB, 하단 고정 버튼 */
  level3: {
    elevation: 6,
    shadowColor: '#4A1B4C',
    shadowOpacity: 0.26,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
  },
} as const;

/** 토스 가이드: 아이콘은 화면에서 24px 이상 */
export const ICON = 24;
export const ICON_SM = 20;

/** 접근성: 터치 대상 최소 48dp */
export const MIN_TOUCH = 48;
