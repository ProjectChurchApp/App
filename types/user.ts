export type Role = '관리자' | '목사' | '성도';

export type AccountStatus = 'ACTIVE' | 'PENDING_PASTOR_APPROVAL' | 'REJECTED';

export interface User {
  loginID: string;
  name: string;
  role: Role;
  accountStatus: AccountStatus;
}

export interface PastorRequest {
  userId: number;
  loginID: string;
  name: string;
  requestedAt: string;
}

export interface UserSummary {
  userId: number;
  loginID: string;
  name: string;
  role: Role;
  accountStatus: AccountStatus | 'SUSPENDED' | 'WITHDRAWN';
  createdAt: string;
}
