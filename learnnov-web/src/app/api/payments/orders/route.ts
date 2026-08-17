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
      where: { userId: payload.userId },
      include: { course: true },
      orderBy: { date: 'desc' }
    });

    const orders = enrollments.map((en, index) => ({
      id: en.id,
      course_id: en.courseId,
      course_name: `رسوم التحاق: ${en.course.title}`,
      amount: en.course.price,
      status: en.payment_status === 'paid' ? 'paid' : 'unpaid',
      created_at: en.date.toISOString(),
      transaction_reference: en.payment_status === 'paid' ? `TXN-LNOV-${en.id.substring(0, 8).toUpperCase()}` : undefined
    }));

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error fetching user payment orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
