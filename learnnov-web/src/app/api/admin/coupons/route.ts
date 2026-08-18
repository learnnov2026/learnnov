import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

const defaultCoupons = [
  { id: '1', code: 'LEARN2026', discountPercent: 25, maxUses: 100, usedCount: 42, active: true, expiresAt: '2026-12-31' },
  { id: '2', code: 'EID50', discountPercent: 50, maxUses: 50, usedCount: 19, active: true, expiresAt: '2026-09-01' },
  { id: '3', code: 'WELCOME10', discountPercent: 10, maxUses: 500, usedCount: 184, active: true, expiresAt: '2026-12-31' }
];

export async function GET(request: Request) {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'promotional_coupons' }
    });

    const coupons = setting ? JSON.parse(setting.value) : defaultCoupons;
    return NextResponse.json(coupons, { status: 200 });
  } catch (error) {
    return NextResponse.json(defaultCoupons, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'manage', resource: 'admin' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const payload = auth.user!;

    const body = await request.json();
    const { code, discountPercent, maxUses, expiresAt } = body;

    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'promotional_coupons' }
    });

    const currentCoupons = setting ? JSON.parse(setting.value) : defaultCoupons;

    const newCoupon = {
      id: String(Date.now()),
      code: code.toUpperCase(),
      discountPercent: Number(discountPercent) || 15,
      maxUses: Number(maxUses) || 100,
      usedCount: 0,
      active: true,
      expiresAt: expiresAt || '2026-12-31'
    };

    const updatedCoupons = [newCoupon, ...currentCoupons];

    await prisma.systemSettings.upsert({
      where: { key: 'promotional_coupons' },
      update: { value: JSON.stringify(updatedCoupons) },
      create: { key: 'promotional_coupons', value: JSON.stringify(updatedCoupons) }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: 'إنشاء كوبون خصم جديد',
        resource: `${newCoupon.code} (${newCoupon.discountPercent}%)`,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
