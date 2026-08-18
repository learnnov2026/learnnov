import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'users' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const payload = auth.user!;

    const { status } = await request.json();

    if (!status || (status !== 'active' && status !== 'suspended')) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: `تغيير حالة حساب مستخدم إلى ${status}`,
        resource: user.email,
        ip: '127.0.0.1',
        severity: 'warning'
      }
    });

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
