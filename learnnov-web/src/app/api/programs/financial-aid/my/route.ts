import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: payload.userId,
        payment_status: 'aid_requested'
      },
      include: {
        course: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    const aidList = enrollments.map(e => ({
      id: e.id,
      program: e.courseId,
      program_name: e.course.title,
      status: e.status === 'approved' ? 'approved' : 'pending',
      created_at: e.date.toISOString(),
      discount_percentage: 50
    }));

    return NextResponse.json(aidList, { status: 200 });

  } catch (error) {
    console.error('Error fetching user financial aid:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
