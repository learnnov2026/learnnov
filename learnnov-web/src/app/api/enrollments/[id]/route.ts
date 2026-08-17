import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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
    if (!payload || (payload.role !== 'admin' && payload.role !== 'instructor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // If was approved, decrement course enrolled_count safely
      if (enrollment.status === 'approved') {
        await tx.course.update({
          where: { id: enrollment.courseId },
          data: { enrolled_count: { decrement: 1 } }
        });
      }

      await tx.enrollment.delete({
        where: { id }
      });
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: 'حذف طلب تسجيل',
        resource: id,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({ success: true, message: 'تم حذف طلب التسجيل بنجاح' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
