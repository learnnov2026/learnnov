import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id') || '207';

    return NextResponse.json({
      target_submission_id: 8820,
      lesson_id: parseInt(lessonId),
      student_alias: 'طالب زميل #429',
      submission_text: 'قمت بتصميم وتطوير معمارية سحابية تعتمد على موازنة الأحمال وتقسيم المهام مع تشفير البيانات الحساسة باستخدام بروتوكولات الأمان القياسية.',
      rubric: [
        { criteria: 'اكتمال البنية البرمجية والتصميم', max_score: 5 },
        { criteria: 'تطبيق معايير الأمان والأداء العالي', max_score: 5 }
      ]
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
