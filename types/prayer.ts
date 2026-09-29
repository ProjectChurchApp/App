export type PrayerVisibility = 'PRIVATE' | 'PASTOR';

export type PrayerBoardStage = 'PERSONAL' | 'SHARED_WITH_PASTOR' | 'INTERCESSORY';

export type PrayerStatus = 'PRAYING' | 'ANSWERED' | 'CLOSED';

export interface PrayerItem {
  id: number;
  title: string;
  contents: string;
  writerName: string;
  writerLoginID: string;
  visibility: PrayerVisibility;
  boardStage: PrayerBoardStage;
  status: PrayerStatus;
  statusChangedAt: string | null;
  prayerCount: number;
  hasPrayed: boolean;
  intercessoryRequested: boolean;
  promotedByName: string | null;
  promotedByLoginID: string | null;
  promotedAt: string | null;
  createdDate: string;
}
