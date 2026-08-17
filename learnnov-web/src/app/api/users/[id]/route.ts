import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, status } = body;

    // Find matching Role record in RBAC
    let roleId = undefined;
    if (role) {
      const rbacRole = await prisma.role.findUnique({
        where: { name: role }
      });
      if (rbacRole) {
        roleId = rbacRole.id;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email ? email.toLowerCase() : undefined,
        role: role || undefined,
        roleId: roleId || undefined,
        status: status || undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: 'تعديل بيانات مستخدم',
        resource: updatedUser.email,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete related records
    await prisma.enrollment.deleteMany({ where: { userId: id } });
    await prisma.certificate.deleteMany({ where: { userId: id } });

    const deletedUser = await prisma.user.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: 'حذف حساب مستخدم نهائياً',
        resource: deletedUser.email,
        ip: '127.0.0.1',
        severity: 'warning'
      }
    });

    return NextResponse.json({ success: true, message: 'تم حذف المستخدم بنجاح' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
