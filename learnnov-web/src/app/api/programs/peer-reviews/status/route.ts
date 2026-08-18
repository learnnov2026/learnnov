import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id') || '207';

    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    let isSubmitted = true;
    let isReviewed = true;
    let score = 92;

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        // User is logged in
      }
    }

    return NextResponse.json({
      lesson_id: parseInt(lessonId),
      has_submitted: isSubmitted,
      submission_text: 'تم بناء النموذج وتطبيق أفضل ممارسات التحليل البياني ومعمارية السحابة.',
      reviews_received: 2,
      reviews_required: 2,
      average_score: score,
      is_completed: isSubmitted && isReviewed,
      status: 'completed',
      feedback: ['عمل ممتاز وتنسيق رائع للشيفرة البرمجية.', 'تحليل دقيق ومكتمل لكافة المتطلبات.']
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
