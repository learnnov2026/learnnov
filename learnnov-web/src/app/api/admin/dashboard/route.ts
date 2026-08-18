import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    // Fetch all required data for the admin dashboard
    let [users, courses, enrollments, certificates, roles, permissions, rolePermissionsRaw, settings] = await Promise.all([
      prisma.user.findMany(),
      prisma.course.findMany(),
      prisma.enrollment.findMany({ include: { user: true, course: true } }),
      prisma.certificate.findMany({ include: { user: true } }),
      prisma.role.findMany(),
      prisma.permission.findMany(),
      prisma.rolePermission.findMany(),
      prisma.systemSettings.findMany()
    ]);

    // Auto-seed default roles if empty
    if (roles.length === 0) {
      const defaultRolesData = [
        { name: 'مدير نظام', description: 'التحكم الكامل بالنظام' },
        { name: 'مدرب / محاضر', description: 'إدارة المحتوى والطلاب' },
        { name: 'طالب / متدرب', description: 'الصلاحيات الأساسية للمتدربين' },
        { name: 'دعم فني', description: 'إدارة التذاكر والمساعدة' }
      ];
      for (const r of defaultRolesData) {
        await prisma.role.create({ data: r }).catch(() => {});
      }
      roles = await prisma.role.findMany();
    }

    // Auto-seed default permissions if empty
    if (permissions.length === 0) {
      const defaultPerms = [
        { action: 'manage', resource: 'courses', description: 'إدارة الدورات' },
        { action: 'manage', resource: 'enrollments', description: 'إدارة طلبات التسجيل' },
        { action: 'manage', resource: 'certificates', description: 'إدارة الشهادات الرقمية' },
        { action: 'manage', resource: 'users', description: 'إدارة المستخدمين' },
        { action: 'manage', resource: 'admin', description: 'إدارة لوحة التحكم وصلاحيات النظام' }
      ];
      for (const p of defaultPerms) {
        await prisma.permission.create({ data: p }).catch(() => {});
      }
      permissions = await prisma.permission.findMany();
    }

    // Format data to match the expected DBStore structure for the frontend
    const formattedEnrollments = enrollments.map(e => ({
      id: e.id,
      userId: e.userId,
      userName: e.user?.name || 'طالب',
      courseId: e.courseId,
      courseTitle: e.course?.title || 'دورة تدريبية',
      date: e.date,
      status: e.status
    }));

    const formattedCertificates = certificates.map(c => ({
      id: c.id,
      userId: c.userId,
      studentName: c.user?.name || 'طالب',
      courseTitle: c.courseTitle,
      issueDate: c.issueDate,
      verifyCode: c.verifyCode,
      grade: c.grade
    }));

    // Convert rolePermissionsRaw into a Record<roleId, permissionId[]>
    const rolePermissions: Record<string, string[]> = {};
    for (const rp of rolePermissionsRaw) {
      if (!rolePermissions[rp.roleId]) rolePermissions[rp.roleId] = [];
      rolePermissions[rp.roleId].push(rp.permissionId);
    }

    // Format settings
    const googleConfigSetting = settings.find(s => s.key === 'googleConfig');
    const googleConfig = googleConfigSetting ? JSON.parse(googleConfigSetting.value) : { clientId: '', clientSecret: '', domain: 'learnnov.com', serviceAccountEmail: '', calendarSyncEnabled: true, classroomSyncEnabled: true, status: 'disconnected' };
    const youtubeConfigSetting = settings.find(s => s.key === 'youtubeConfig');
    const youtubeConfig = youtubeConfigSetting ? JSON.parse(youtubeConfigSetting.value) : { apiKey: '', channelId: '', liveStreamingEnabled: true, analyticsEnabled: true, status: 'disconnected' };

    // Format users to ensure role_id is present
    const formattedUsers = users.map(u => {
      const matchedRole = roles.find(r => r.id === u.roleId || r.name.toLowerCase().includes(u.role?.toLowerCase() || ''));
      return {
        ...u,
        role_id: matchedRole ? matchedRole.id : (roles[0]?.id || 1)
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      roles,
      permissions: permissions.map(p => ({ ...p, code: `${p.action}:${p.resource}`, name: p.description || `${p.action} ${p.resource}` })),
      rolePermissions,
      courses,
      enrollments: formattedEnrollments,
      certificates: formattedCertificates,
      auditLogs: [],
      googleConfig,
      youtubeConfig
    }, { status: 200 });

  } catch (error) {
    console.error('Error in admin dashboard api:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
