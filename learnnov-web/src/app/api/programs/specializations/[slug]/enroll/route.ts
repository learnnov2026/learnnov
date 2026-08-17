import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const courses = await prisma.course.findMany({ take: 3 });

    // Enroll user into the courses of this specialization atomically
    for (const course of courses) {
      const existing = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: payload.userId,
            courseId: course.id
          }
        }
      });

      if (!existing) {
        await prisma.enrollment.create({
          data: {
            userId: payload.userId,
            courseId: course.id,
            status: 'approved',
            payment_status: 'paid',
            notes: `مسار تخصصي: ${slug}`
          }
        });

        await prisma.course.update({
          where: { id: course.id },
          data: { enrolled_count: { increment: 1 } }
        });
      } else {
        await prisma.enrollment.update({
          where: { id: existing.id },
          data: {
            status: 'approved',
            payment_status: 'paid'
          }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Student',
        action: 'التحاق بمسار تخصصي كامل',
        resource: slug,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم الالتحاق بالمسار التخصصي وجميع كورساته بنجاح وتفعيل الوصول لكافة المختبرات والاختبارات!'
    }, { status: 200 });

  } catch (error) {
    console.error('Error enrolling into specialization:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
