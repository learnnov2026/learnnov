import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PATCH(
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
    if (!payload || (payload.role !== 'instructor' && payload.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body; // 'accepted' | 'approved' | 'rejected'

    const targetStatus = (status === 'accepted' || status === 'approved') ? 'approved' : 'rejected';

    const currentEnrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!currentEnrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const oldStatus = currentEnrollment.status;
    const courseId = currentEnrollment.courseId;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.enrollment.update({
        where: { id },
        data: { status: targetStatus }
      });

      // Update enrolled_count on course
      if (oldStatus !== 'approved' && targetStatus === 'approved') {
        await tx.course.update({
          where: { id: courseId },
          data: { enrolled_count: { increment: 1 } }
        });
      } else if (oldStatus === 'approved' && targetStatus !== 'approved') {
        await tx.course.update({
          where: { id: courseId },
          data: { enrolled_count: { decrement: 1 } }
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, enrollment: result }, { status: 200 });

  } catch (error) {
    console.error('Error reviewing application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
