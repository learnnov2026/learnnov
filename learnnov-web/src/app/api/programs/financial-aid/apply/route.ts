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
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { program, reason_for_applying, career_goals, financial_situation } = body;

    const courseId = program ? program.toString() : '';

    // Create an enrollment with status pending and payment_status 'aid_requested'
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { id: courseId },
          { title: { contains: 'الذكاء الاصطناعي' } }
        ]
      }
    });

    if (course) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: payload.userId,
            courseId: course.id
          }
        },
        update: {
          status: 'pending',
          payment_status: 'aid_requested'
        },
        create: {
          userId: payload.userId,
          courseId: course.id,
          status: 'pending',
          payment_status: 'aid_requested'
        }
      });
    }

    // Log the financial aid application into AuditLog table
    await prisma.auditLog.create({
      data: {
        user: payload.name || 'طالب ليرنوف',
        action: 'تقديم طلب دعم مالي (Financial Aid)',
        resource: course ? course.title : `Program ${program}`,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم استلام طلب الدعم المالي بنجاح وسيتم مراجعته من قبل اللجنة الأكاديمية خلال 48 ساعة.'
    }, { status: 200 });

  } catch (error) {
    console.error('Error in financial aid application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
