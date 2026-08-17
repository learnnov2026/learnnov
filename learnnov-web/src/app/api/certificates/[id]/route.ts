import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find certificate by id or verifyCode
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { id },
          { verifyCode: id }
        ]
      }
    });

    if (!cert) {
      return NextResponse.json({ error: 'الشهادة غير موجودة' }, { status: 404 });
    }

    await prisma.certificate.delete({
      where: { id: cert.id }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: 'إلغاء وحذف شهادة رقمية',
        resource: `${cert.verifyCode} (${cert.courseTitle})`,
        ip: '127.0.0.1',
        severity: 'critical'
      }
    });

    return NextResponse.json({ success: true, message: 'تم إلغاء وحذف الشهادة بنجاح' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
