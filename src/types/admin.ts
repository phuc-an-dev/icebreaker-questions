export type AdminRole = 'master_admin' | 'admin';
export type AdminStatus = 'active' | 'suspended';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  salt: string;
  role: AdminRole;
  status: AdminStatus;
  mustChangePassword?: boolean;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AdminUserPublic {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  status: AdminStatus;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type AuditAction =
  | 'CREATE_QUESTION'
  | 'UPDATE_QUESTION'
  | 'DELETE_QUESTION'
  | 'BULK_DELETE_QUESTIONS';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actorId: string;
  actorName: string;
  actorEmail: string;
  targetId?: number | string | number[];
  targetText?: string;
  timestamp: string;
}
