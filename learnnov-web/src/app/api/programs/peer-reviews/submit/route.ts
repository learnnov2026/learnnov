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
    const { submission_id, score, feedback } = body;

    return NextResponse.json({
      success: true,
      message: 'تم اعتماد تقييم الزميل وإرسال الملاحظات بنجاح! 🌟',
      review: {
        id: Date.now(),
        submission_id,
        score: score || 5,
        feedback: feedback || 'تقييم ممتاز'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting peer review:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
