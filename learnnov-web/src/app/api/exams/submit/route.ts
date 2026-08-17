import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const letterToIndex: Record<string, number> = {
  'A': 0, 'a': 0, '0': 0,
  'B': 1, 'b': 1, '1': 1,
  'C': 2, 'c': 2, '2': 2,
  'D': 3, 'd': 3, '3': 3
};

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { examId, answers } = body; // answers is Record<questionIdOrIndex, selectedChoiceKey>

    if (!examId || !answers) {
      return NextResponse.json({ error: 'Missing exam submission data' }, { status: 400 });
    }

    const exam = await prisma.exam.findFirst({
      where: {
        OR: [
          { id: String(examId) },
          { title: { contains: String(examId) } }
        ]
      },
      include: { questions: true, course: true }
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    let correctCount = 0;
    const totalQuestions = exam.questions.length;

    exam.questions.forEach((q, index) => {
      // Look up answer by question ID, numeric index, or question index
      const rawAnswer = answers[q.id] ?? answers[index] ?? answers[String(index)] ?? answers[String(q.id)];
      if (rawAnswer !== undefined && rawAnswer !== null) {
        const normalizedUserAnswer = typeof rawAnswer === 'number' 
          ? rawAnswer 
          : (letterToIndex[String(rawAnswer).trim()] ?? Number(rawAnswer));

        if (normalizedUserAnswer === q.correctIndex) {
          correctCount++;
        }
      }
    });

    // Precise mathematical score calculation
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = scorePercentage >= (exam.passingScore || 70);

    let certificate = null;

    if (isPassed && exam.course) {
      // Check if certificate already exists
      const existingCert = await prisma.certificate.findFirst({
        where: {
          userId: payload.userId,
          courseTitle: exam.course.title
        }
      });

      if (!existingCert) {
        const verifyCode = `CERT-LNOV-${Math.floor(1000 + Math.random() * 9000)}`;
        const gradeText = scorePercentage >= 95 
          ? `امتياز مرتفع (${scorePercentage}%)`
          : scorePercentage >= 85 
          ? `ممتاز (${scorePercentage}%)`
          : scorePercentage >= 75 
          ? `جيد جداً (${scorePercentage}%)`
          : `ناجح (${scorePercentage}%)`;

        certificate = await prisma.certificate.create({
          data: {
            userId: payload.userId,
            courseTitle: exam.course.title,
            grade: gradeText,
            verifyCode,
            is_specialization: false
          }
        });
      } else {
        certificate = existingCert;
      }
    }

    return NextResponse.json({
      success: true,
      score: scorePercentage,
      correctCount,
      totalQuestions,
      isPassed,
      passingScore: exam.passingScore || 70,
      certificate
    }, { status: 200 });

  } catch (error) {
    console.error('Error grading exam:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
