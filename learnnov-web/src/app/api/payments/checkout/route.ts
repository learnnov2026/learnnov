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
    const { invoice_id, coupon_code } = body;

    if (!invoice_id) {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    // SECURITY: IDOR Protection — Check invoice ownership
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { id: String(invoice_id) },
      include: { course: true }
    });

    if (!existingEnrollment) {
      return NextResponse.json({ error: 'الفاتورة أو طلب التسجيل غير موجود' }, { status: 404 });
    }

    if (existingEnrollment.userId !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: 'غير مصرح لك بإجراء عملية الدفع لهذا الحساب' }, { status: 403 });
    }

    // Logical Check: If already paid and approved, return early safely
    if (existingEnrollment.payment_status === 'paid' && existingEnrollment.status === 'approved') {
      return NextResponse.json({
        success: true,
        message: 'تم سداد هذه الفاتورة مسبقاً وتأكيد الحجز!',
        enrollment: existingEnrollment
      }, { status: 200 });
    }

    // Capacity Check
    if (existingEnrollment.course.enrolled_count >= existingEnrollment.course.capacity) {
      return NextResponse.json({
        error: 'عذراً، المقاعد مكتملة في هذه الدورة.'
      }, { status: 400 });
    }

    // Execute atomic transaction for payment, status update, and seat increment
    const updatedEnrollment = await prisma.$transaction(async (tx) => {
      // 1. Update enrollment
      const updated = await tx.enrollment.update({
        where: { id: String(invoice_id) },
        data: {
          payment_status: 'paid',
          status: 'approved'
        },
        include: { course: true, user: true }
      });

      // 2. Increment course enrolled count if it was not already approved
      if (existingEnrollment.status !== 'approved') {
        await tx.course.update({
          where: { id: existingEnrollment.courseId },
          data: { enrolled_count: { increment: 1 } }
        });
      }

      return updated;
    });

    // If a valid coupon was used, increment its usedCount
    if (coupon_code) {
      try {
        const setting = await prisma.systemSettings.findUnique({
          where: { key: 'promotional_coupons' }
        });
        if (setting) {
          const coupons = JSON.parse(setting.value);
          const updatedCoupons = coupons.map((c: any) => 
            c.code.toUpperCase() === String(coupon_code).toUpperCase() 
              ? { ...c, usedCount: (c.usedCount || 0) + 1 }
              : c
          );
          await prisma.systemSettings.update({
            where: { key: 'promotional_coupons' },
            data: { value: JSON.stringify(updatedCoupons) }
          });
        }
      } catch (err) {}
    }

    const txnRef = `TXN-ST-${Math.floor(1000000 + Math.random() * 9000000)}`;

    return NextResponse.json({
      success: true,
      message: 'تمت معالجة عملية الدفع وتأكيد الحجز بنجاح!',
      transaction_reference: txnRef,
      enrollment: updatedEnrollment
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing payment checkout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
