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
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, courseTitle, grade } = body;

    if (!userId || !courseTitle || !grade) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const verifyCode = `CERT-${Math.floor(1000 + Math.random() * 9000)}`;

    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseTitle,
        grade,
        verifyCode,
        is_specialization: false
      }
    });

    return NextResponse.json({ success: true, certificate }, { status: 201 });
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
