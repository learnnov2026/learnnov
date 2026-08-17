import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(
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

    const body = await request.json();
    const { status, adminReply } = body;

    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'support_tickets' }
    });

    if (setting) {
      const tickets = JSON.parse(setting.value);
      const updated = tickets.map((t: any) => t.id === id ? { ...t, status: status || t.status, adminReply: adminReply || t.adminReply } : t);
      await prisma.systemSettings.update({
        where: { key: 'support_tickets' },
        data: { value: JSON.stringify(updated) }
      });
    }

    await prisma.auditLog.create({
      data: {
        user: payload.name || 'Admin',
        action: `معالجة تذكرة دعم فني (${status})`,
        resource: id,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
