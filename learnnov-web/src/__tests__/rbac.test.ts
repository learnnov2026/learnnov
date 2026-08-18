import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeRequest, getLiveUserWithPermissions } from '@/lib/rbac';
import prisma from '@/lib/prisma';
import * as authModule from '@/lib/auth';

describe('RBAC Authorization Engine (rbac.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects request when no session token is provided (401)', async () => {
    const req = new Request('http://localhost:3000/api/admin/dashboard', {
      headers: {}
    });

    const result = await authorizeRequest(req);
    expect(result.authorized).toBe(false);
    expect(result.response?.status).toBe(401);
  });

  it('rejects request when JWT token is invalid or corrupted (401)', async () => {
    vi.spyOn(authModule, 'verifyToken').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/dashboard', {
      headers: {
        cookie: 'learnnov_session=invalid-token'
      }
    });

    const result = await authorizeRequest(req);
    expect(result.authorized).toBe(false);
    expect(result.response?.status).toBe(401);
  });

  it('rejects request when user account is suspended in database (403)', async () => {
    vi.spyOn(authModule, 'verifyToken').mockResolvedValue({
      userId: 'user-suspended-1',
      role: 'student',
      email: 'suspended@learnnov.com',
      name: 'مستخدم موقوف',
      avatar: 'avatar.png'
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-suspended-1',
      name: 'مستخدم موقوف',
      email: 'suspended@learnnov.com',
      password: 'hash',
      role: 'student',
      roleId: null,
      status: 'suspended',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roleObj: null
    } as any);

    const req = new Request('http://localhost:3000/api/courses', {
      headers: {
        cookie: 'learnnov_session=valid-token'
      }
    });

    const result = await authorizeRequest(req);
    expect(result.authorized).toBe(false);
    expect(result.response?.status).toBe(403);
  });

  it('allows Super Admin full access without restriction', async () => {
    vi.spyOn(authModule, 'verifyToken').mockResolvedValue({
      userId: 'admin-1',
      role: 'admin',
      email: 'admin@learnnov.com',
      name: 'مدير النظام',
      avatar: 'avatar.png'
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'admin-1',
      name: 'مدير النظام',
      email: 'admin@learnnov.com',
      password: 'hash',
      role: 'admin',
      roleId: 'role-admin-id',
      status: 'active',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roleObj: null
    } as any);

    const req = new Request('http://localhost:3000/api/admin/roles', {
      headers: {
        cookie: 'learnnov_session=valid-token'
      }
    });

    const result = await authorizeRequest(req, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });

    expect(result.authorized).toBe(true);
    expect(result.user?.role).toBe('admin');
  });

  it('verifies dynamic permissions for instructors/supervisors', async () => {
    vi.spyOn(authModule, 'verifyToken').mockResolvedValue({
      userId: 'instructor-1',
      role: 'instructor',
      email: 'instructor@learnnov.com',
      name: 'د. خالد بن محمد',
      avatar: 'avatar.png'
    });

    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'instructor-1',
      name: 'د. خالد بن محمد',
      email: 'instructor@learnnov.com',
      password: 'hash',
      role: 'instructor',
      roleId: 'role-instructor-id',
      status: 'active',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      roleObj: {
        id: 'role-instructor-id',
        name: 'instructor',
        description: 'مشرف',
        permissions: [
          {
            id: 'rp-1',
            roleId: 'role-instructor-id',
            permissionId: 'perm-1',
            permission: {
              id: 'perm-1',
              action: 'manage',
              resource: 'courses',
              description: 'إدارة الدورات'
            }
          }
        ]
      }
    } as any);

    const req = new Request('http://localhost:3000/api/courses', {
      headers: {
        cookie: 'learnnov_session=valid-token'
      }
    });

    // Allowed action (manage:courses grants create:courses)
    const allowedResult = await authorizeRequest(req, {
      requiredPermission: { action: 'create', resource: 'courses' }
    });
    expect(allowedResult.authorized).toBe(true);

    // Forbidden action (instructor does not have manage:admin)
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
    const deniedResult = await authorizeRequest(req, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });
    expect(deniedResult.authorized).toBe(false);
    expect(deniedResult.response?.status).toBe(403);
  });
});
