import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { status } = await request.json();

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const currentEnrollment = await prisma.enrollment.findUnique({
      where: { id: id },
      select: { status: true, courseId: true }
    });

    if (!currentEnrollment) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      // Update enrollment status
      const updated = await tx.enrollment.update({
        where: { id: id },
        data: { status }
      });

      // Update course enrolled_count if status changes to/from 'approved'
      if (status === 'approved' && currentEnrollment.status !== 'approved') {
        await tx.course.update({
          where: { id: currentEnrollment.courseId },
          data: { enrolled_count: { increment: 1 } }
        });
      } else if (currentEnrollment.status === 'approved' && status !== 'approved') {
        await tx.course.update({
          where: { id: currentEnrollment.courseId },
          data: { enrolled_count: { decrement: 1 } }
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, enrollment }, { status: 200 });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
