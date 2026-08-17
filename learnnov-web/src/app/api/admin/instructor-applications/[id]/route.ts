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
    const { status, email } = body;

    // Update stored applications
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'instructor_applications' }
    });

    if (setting) {
      const apps = JSON.parse(setting.value);
      const updated = apps.map((a: any) => a.id === id ? { ...a, status } : a);
      await prisma.systemSettings.update({
        where: { key: 'instructor_applications' },
        data: { value: JSON.stringify(updated) }
      });
    }

    // If approved and email provided, elevate user role to 'instructor'
    if (status === 'approved' && email) {
      await prisma.user.updateMany({
        where: { email },
        data: { role: 'instructor' }
      });
    }

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: `مراجعة طلب انضمام محاضر (${status})`,
        resource: id,
        ip: '127.0.0.1',
        severity: status === 'approved' ? 'info' : 'warning'
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error reviewing instructor app:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
