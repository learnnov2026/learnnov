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
    const { status, discountGranted, note } = body;

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        status: status || 'approved',
        payment_status: status === 'approved' ? 'paid' : 'unpaid',
        notes: note ? `[منحة: ${discountGranted || '100%'}] ${note}` : undefined
      },
      include: { user: true, course: true }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: `معالجة طلب دعم مالي (${status})`,
        resource: `${updated.user.name} - ${updated.course.title}`,
        ip: '127.0.0.1',
        severity: status === 'approved' ? 'info' : 'warning'
      }
    });

    return NextResponse.json({ success: true, application: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating financial aid:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
