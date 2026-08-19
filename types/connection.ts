export type ConnectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PastorOption {
  loginID: string;
  name: string;
}

export interface Connection {
  id: number;
  memberLoginID: string;
  memberName: string;
  pastorLoginID: string;
  pastorName: string;
  status: ConnectionStatus;
  requestedAt: string;
  respondedAt: string | null;
}

export interface MemberSummary {
  loginID: string;
  name: string;
}
