import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { courseId, notes } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Use payload.userId — the correct field from JWT token
    const userId = payload.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    // Logical Error Fix: Prevent duplicate enrollments
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { userId, courseId }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'أنت مسجل بالفعل في هذه الدورة أو لديك طلب قيد الانتظار.' }, { status: 409 });
    }

    // Calculation Error Fix: Check course capacity
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json({ error: 'الدورة غير موجودة' }, { status: 404 });
    }

    if (course.enrolled_count >= course.capacity) {
      return NextResponse.json({ error: 'عذراً، هذه الدورة مكتملة العدد.' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        notes: notes || '',
        status: 'pending',
        payment_status: 'unpaid'
      }
    });

    return NextResponse.json({ success: true, enrollment }, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
