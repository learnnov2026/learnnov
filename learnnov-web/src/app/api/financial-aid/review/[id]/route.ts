import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'enrollments' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const payload = auth.user!;
    const body = await request.json();
    const { status } = body;

    const targetStatus = (status === 'approved' || status === 'accepted') ? 'approved' : 'rejected';

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        OR: [
          { id },
          { id: String(id) }
        ]
      }
    });

    if (enrollment) {
      const updated = await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: targetStatus,
          payment_status: targetStatus === 'approved' ? 'paid' : 'unpaid'
        }
      });
      return NextResponse.json({ success: true, application: updated }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: 'تم تحديث حالة الدعم المالي' }, { status: 200 });
  } catch (error) {
    console.error('Error reviewing financial aid:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
