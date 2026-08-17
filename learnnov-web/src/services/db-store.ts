// Location: src/services/db-store.ts
// This file now only serves as a type definition file for the mock frontend structures
// since the backend has been migrated to Prisma.

export interface User {
  id: number | string;
  name: string;
  email: string;
  role_id: number;
  status: 'active' | 'suspended';
  mfa_enabled?: boolean;
  avatar?: string;
  overrides?: Array<{ perm_id: number; type: 'allow' | 'deny' }>;
  created_at?: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  is_system: boolean;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  group: string;
}

export interface Course {
  id: number | string;
  title: string;
  category: string;
  instructor: string;
  price: number;
  capacity: number;
  enrolled_count: number;
  image: string;
}

export interface Enrollment {
  id: number | string;
  userId: number | string;
  userName: string;
  courseId: number | string;
  courseTitle: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Certificate {
  id: string;
  studentName: string;
  courseTitle: string;
  issueDate: string;
  verifyCode: string;
  grade: string;
}

export interface AuditLog {
  id: number;
  user: string;
  action: string;
  resource: string;
  ip: string;
  timestamp: string;
}

export interface DBStore {
  users: User[];
  roles: Role[];
  permissions: Permission[];
  rolePermissions: Record<number, number[]>; // roleId -> permIds
  courses: Course[];
  enrollments: Enrollment[];
  certificates: Certificate[];
  auditLogs: AuditLog[];
}
