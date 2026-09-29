// 기도 상태와 공개 범위의 표시 방법을 한 곳에서 정의한다.
// 이전에는 각 화면이 저마다 이모지 문자열을 하드코딩해 서로 달라지기 쉬웠다.

import { Palette } from './design';
import type { PrayerBoardStage, PrayerItem, PrayerStatus, PrayerVisibility } from '../types/prayer';

export type ChipTone = {
  label: string;
  fg: string;
  bg: string;
};

export const STATUS_META: Record<PrayerStatus, ChipTone> = {
  PRAYING: {
    label: '기도중',
    fg: Palette.onAccentContainer,
    bg: Palette.accentContainer,
  },
  ANSWERED: {
    label: '응답',
    fg: Palette.onSuccessContainer,
    bg: Palette.successContainer,
  },
  CLOSED: {
    label: '종료',
    fg: Palette.onSurfaceVariant,
    bg: Palette.surfaceVariant,
  },
};

export const STATUS_ORDER: PrayerStatus[] = ['PRAYING', 'ANSWERED', 'CLOSED'];

/** 공개 범위 배지: 중보기도 승격 여부 > 중보기도 요청 여부 > 공개 범위 순으로 판정한다. */
export function visibilityMeta(item: {
  boardStage: PrayerBoardStage;
  visibility: PrayerVisibility;
  intercessoryRequested: boolean;
}): ChipTone {
  if (item.boardStage === 'INTERCESSORY') {
    return {
      label: '중보기도',
      fg: Palette.onSecondaryContainer,
      bg: Palette.secondaryContainer,
    };
  }
  if (item.visibility === 'PRIVATE') {
    return {
      label: '나만보기',
      fg: Palette.onSurfaceVariant,
      bg: Palette.surfaceVariant,
    };
  }
  if (item.intercessoryRequested) {
    return {
      label: '중보기도 요청',
      fg: Palette.onSecondaryContainer,
      bg: Palette.secondaryContainer,
    };
  }
  return {
    label: '목사님만 기도',
    fg: Palette.onPrimaryContainer,
    bg: Palette.primaryContainer,
  };
}

/** 상세 화면에서 "응답 · 2026. 9. 29." 처럼 붙일 접두어 */
export function statusChangeLabel(status: PrayerStatus): string | null {
  if (status === 'PRAYING') return null;
  return STATUS_META[status].label;
}

export type { PrayerItem };
