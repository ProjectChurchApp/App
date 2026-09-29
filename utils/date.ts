// 서버는 LocalDateTime을 타임존 없는 문자열("2026-09-29T14:30:00")로 내려준다.
// 그대로 new Date()에 넣으면 단말 로컬 시간대로 해석되어 기기 설정에 따라 시각이 어긋난다.
const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/;
const KST = 'Asia/Seoul';

export function parseServerDate(iso: string): Date {
  return new Date(HAS_TIMEZONE.test(iso) ? iso : `${iso}+09:00`);
}

/** 목록용: 오늘이면 시각, 일주일 내면 N일 전, 그 외에는 월/일 */
export function formatDate(iso: string): string {
  const date = parseServerDate(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: KST,
    });
  }
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: KST });
}

/** 상세용: 2026년 9월 29일 오후 02:30 */
export function formatDateFull(iso: string): string {
  return parseServerDate(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: KST,
  });
}

/** 응답/종료 시점 표기용: 2026. 9. 29. */
export function formatDateOnly(iso: string): string {
  return parseServerDate(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: KST,
  });
}
