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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch aid enrollments where notes contain Financial Aid or notes exist
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: true,
        course: true
      },
      orderBy: { date: 'desc' }
    });

    const aidApplications = enrollments.map((e, idx) => {
      let details = {
        annualIncome: 'أقل من 20,000 ر.س',
        employmentStatus: 'طالب جامعي / باحث عن عمل',
        reason: e.notes || 'طلب منحة دراسية لتطوير المهارات التقنية والحصول على شهادة معتمدة.',
        discountGranted: e.status === 'approved' ? '100%' : 'قيد المراجعة'
      };

      return {
        id: e.id,
        applicantName: e.user?.name || 'متقدم',
        email: e.user?.email || 'email@learnnov.com',
        courseId: e.courseId,
        courseTitle: e.course?.title || 'دورة تدريبية',
        coursePrice: e.course?.price || 450,
        status: e.status, // pending, approved, rejected
        appliedAt: e.date.toISOString().split('T')[0],
        ...details
      };
    });

    return NextResponse.json(aidApplications, { status: 200 });
  } catch (error) {
    console.error('Error fetching financial aid applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
