// 목록에서 상세로 들어갈 때, 그 탭이 보여주던 기도 순서를 기억해 둔다.
//
// 상세 화면에서 옆으로 쓸어 다음 기도로 넘어가려면 "다음"이 무엇인지 알아야 한다.
// 그때 서버에 다시 물어보면 검색어·상태 필터가 반영되지 않아, 사용자가 방금 보던
// 목록과 다른 순서로 넘어가 버린다. 그래서 화면에 실제로 그려져 있던 순서를 그대로 들고 간다.
//
// 탭마다 목록이 다르므로(나의기도 / 중보기도 / 성도기도요청) 탭 이름으로 나눠 담는다.

const orders: Record<string, number[]> = {};

/** 목록 화면에서 상세로 들어가기 직전에 호출한다. */
export function rememberPrayerOrder(tab: string, ids: number[]) {
  orders[tab] = ids;
}

/** 상세 화면에서 앞뒤 기도를 찾을 때 쓴다. 기억해 둔 게 없으면 빈 배열. */
export function getPrayerOrder(tab: string): number[] {
  return orders[tab] ?? [];
}
