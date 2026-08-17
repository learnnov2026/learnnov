import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface CouponItem {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  expiresAt: string;
}

const defaultCoupons: CouponItem[] = [
  { id: '1', code: 'LEARN2026', discountPercent: 25, maxUses: 100, usedCount: 42, active: true, expiresAt: '2026-12-31' },
  { id: '2', code: 'EID50', discountPercent: 50, maxUses: 50, usedCount: 19, active: true, expiresAt: '2026-12-31' },
  { id: '3', code: 'WELCOME10', discountPercent: 10, maxUses: 500, usedCount: 184, active: true, expiresAt: '2026-12-31' },
  { id: '4', code: 'LEARNNOV20', discountPercent: 20, maxUses: 200, usedCount: 50, active: true, expiresAt: '2026-12-31' }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, amount } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, message: 'يرجى إدخال كود الخصم بشكل صحيح' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const originalAmount = Math.max(0, Number(amount) || 0);

    // Fetch live coupons from Database
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'promotional_coupons' }
    });

    const couponsList: CouponItem[] = setting ? JSON.parse(setting.value) : defaultCoupons;
    const found = couponsList.find(c => c.code.toUpperCase() === cleanCode);

    if (!found) {
      return NextResponse.json({ 
        valid: false, 
        message: 'كود الخصم غير موجود' 
      }, { status: 404 });
    }

    if (!found.active) {
      return NextResponse.json({
        valid: false,
        message: 'تم إيقاف كود الخصم هذا من قبل الإدارة'
      }, { status: 400 });
    }

    // Expiry check
    if (found.expiresAt) {
      const expDate = new Date(found.expiresAt);
      const now = new Date();
      if (now > expDate) {
        return NextResponse.json({
          valid: false,
          message: 'عذراً، انتهت صلاحية كود الخصم هذا'
        }, { status: 400 });
      }
    }

    // Usage limit check
    if (found.maxUses && found.usedCount >= found.maxUses) {
      return NextResponse.json({
        valid: false,
        message: 'عذراً، تم استنفاد الحد الأقصى لاستخدام هذا الكوبون'
      }, { status: 400 });
    }

    // Calculate discount
    const discountPercent = Math.min(100, Math.max(1, Number(found.discountPercent) || 10));
    const discountAmount = Math.round((originalAmount * discountPercent) / 100);
    const netAmount = Math.max(0, originalAmount - discountAmount);

    return NextResponse.json({
      valid: true,
      code: cleanCode,
      discount_amount: discountAmount,
      discount_percent: discountPercent,
      original_amount: originalAmount,
      net_amount: netAmount,
      message: `تم تطبيق خصم بقيمة ${discountAmount} ر.س (${discountPercent}%) بنجاح!`
    }, { status: 200 });

  } catch (error) {
    console.error('Error applying discount:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
