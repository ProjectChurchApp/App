export interface BoardItem {
  id: number;
  title: string;
  contents: string;
  writerName: string;
  writerLoginID: string;
  status: 'READ' | 'UNREAD';
  createdDate: string;
}
