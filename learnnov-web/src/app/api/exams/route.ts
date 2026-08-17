import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    let isAdmin = false;
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.role === 'admin') {
        isAdmin = true;
      }
    }

    let exams = await prisma.exam.findMany({
      include: {
        course: true,
        questions: true
      }
    });

    // Auto-seed exams if empty
    if (exams.length === 0) {
      const courses = await prisma.course.findMany();
      if (courses.length > 0) {
        await prisma.exam.create({
          data: {
            title: 'التقييم الشامل في خوارزميات التعلم الآلي والـ LLMs',
            courseId: courses[0].id,
            durationMinutes: 10,
            totalQuestions: 3,
            passingScore: 70,
            questions: {
              create: [
                {
                  question: 'ما هي التقنية المستخدمة لحل مشكلة تضاؤل التدرج (Vanishing Gradient) في معالجة النصوص الطويلة؟',
                  options: JSON.stringify(['شبكات LSTM / GRU مع بوابات التذكر والنسيان', 'استخدام دوال التنشيط الخطية فقط', 'تقليل عدد الطبقات إلى طبقة واحدة', 'إلغاء أوزان التدريب']),
                  correctIndex: 0
                },
                {
                  question: 'ما هو الدور الأساسي لآلية Attention Mechanism في نماذج الـ Transformers؟',
                  options: JSON.stringify(['تقليل استهلاك الذاكرة العشوائية فقط', 'تمكين النموذج من التركيز على الكلمات الأكثر صلة في السياق بغض النظر عن المسافة', 'تشفير قاعدة البيانات', 'تحويل الصوت إلى صورة']),
                  correctIndex: 1
                },
                {
                  question: 'ما هو الفرق الأساسي بين التوليد باستخدام RAG والتدريب الكامل Fine-Tuning؟',
                  options: JSON.stringify(['RAG يسترجع المعلومات الديناميكية من مصادر خارجية دون إعادة تدريب الأوزان', 'Fine-Tuning لا يغير أوزان النموذج إطلاقاً', 'RAG مخصص فقط للصور', 'لا يوجد أي فرق بينهما']),
                  correctIndex: 0
                }
              ]
            }
          }
        });

        if (courses.length > 1) {
          await prisma.exam.create({
            data: {
              title: 'التقييم الأساسي لهندسة البرمجيات وتطبيقات الويب الحديثة',
              courseId: courses[1].id,
              durationMinutes: 10,
              totalQuestions: 3,
              passingScore: 70,
              questions: {
                create: [
                  {
                    question: 'ما هي الميزة الأساسية لـ React Server Components (RSC) في Next.js؟',
                    options: JSON.stringify(['تنفيذ كود الواجهة وجلب البيانات على الخادم لتقليل حجم حزمة الجافاسكريبت للعميل', 'إلغاء الحاجة لقواعد البيانات', 'تسريع تشغيل المتصفح فقط', 'تحويل التطبيق إلى تطبيق سطح مكتب']),
                    correctIndex: 0
                  },
                  {
                    question: 'ما هو الغرض من استخدام HttpOnly Cookies في تخزين جلسات المستخدمين (Sessions)؟',
                    options: JSON.stringify(['حماية التوكن من سرقة هجمات XSS عبر الجافاسكريبت بالمتصفح', 'تسريع استجابة الخادم', 'ضغط بيانات الجلسة', 'تغيير لون المتصفح']),
                    correctIndex: 0
                  },
                  {
                    question: 'أي بروتوكول يوفر اتصالاً ثنائي الاتجاه منخفض التأخير في تطبيقات الدردشة الفورية؟',
                    options: JSON.stringify(['WebSockets', 'HTTP/1.0', 'FTP', 'SMTP']),
                    correctIndex: 0
                  }
                ]
              }
            }
          });
        }
      }

      exams = await prisma.exam.findMany({
        include: {
          course: true,
          questions: true
        }
      });
    }

    // Secure exam question delivery: do NOT expose correctIndex or correctAnswer to student clients
    const formatted = exams.map(e => ({
      id: e.id,
      title: e.title,
      course_name: e.course?.title || 'دورة تدريبية',
      questions_count: e.questions.length,
      duration_minutes: e.durationMinutes,
      passing_score: e.passingScore,
      questions: e.questions.map(q => {
        let choices = [];
        try {
          choices = JSON.parse(q.options).map((opt: string, idx: number) => ({
            key: ['A', 'B', 'C', 'D'][idx] || String(idx),
            index: idx,
            text: opt
          }));
        } catch (err) {
          choices = [];
        }

        return {
          id: q.id,
          text: q.question,
          choices,
          // Only reveal correct answer to system admin, never to test-taking students
          ...(isAdmin ? { correctIndex: q.correctIndex } : {})
        };
      })
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
