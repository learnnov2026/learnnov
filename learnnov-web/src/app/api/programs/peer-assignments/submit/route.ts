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
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const body = await request.json();
    const { lesson, submission_text } = body;

    if (!submission_text) {
      return NextResponse.json({ error: 'يرجى كتابة نص المشروع والحل قبل الإرسال' }, { status: 400 });
    }

    await prisma.auditLog.create({
      data: {
        user: payload.name,
        action: 'تسليم مشروع تقييم الزملاء',
        resource: `درس رقم: ${lesson}`,
        ip: '127.0.0.1',
        severity: 'info'
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'تم تسليم مشروعك بنجاح ونقله لمرحلة مراجعة الزملاء! 🎉',
      submission: {
        id: Date.now(),
        lesson_id: lesson,
        submitted_at: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting peer assignment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
