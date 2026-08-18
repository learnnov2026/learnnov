import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Lookup course in PostgreSQL
    const course = await prisma.course.findFirst({
      where: {
        OR: [
          { id: slug },
          { title: { contains: slug } }
        ]
      }
    });

    const courseTitle = course?.title || 'المقرر الأكاديمي';

    const modules = [
      {
        id: 101,
        title: `الوحدة الأولى: الأساسيات والمدخل الشامل لـ (${courseTitle})`,
        description: 'تأسيس المعايير والمفاهيم النظرية وبنية الأدوات المطلوبة للبدء.',
        order: 1,
        lessons: [
          {
            id: 201,
            title: `مقدمة عامة واستعراض الخطة الأكاديمية لمقرر: ${courseTitle}`,
            lesson_type: 'video',
            duration_minutes: 15,
            order: 1,
            is_preview: true
          },
          {
            id: 202,
            title: 'المفاهيم والنظريات الأساسية ومعايير التصميم المعتمدة',
            lesson_type: 'text',
            content: `تعتمد هذه المحاضرة التأسيسية على فهم المنهج العلمي والتحليل المنطقي للمحاور الرئيسية في ${courseTitle}. يهدف هذا الجزء إلى تمكين الدارس من استيعاب المفاهيم الجوهرية والتعرف على أفضل الممارسات المعتمدة عالمياً واستخدام التقنيات السحابية الحديثة.`,
            duration_minutes: 25,
            order: 2,
            is_preview: false
          },
          {
            id: 203,
            title: 'استقصاء الفهم: اختبار قصير لقياس المخرجات التأسيسية',
            lesson_type: 'quiz',
            duration_minutes: 10,
            order: 3,
            is_preview: false
          }
        ]
      },
      {
        id: 102,
        title: 'الوحدة الثانية: التطبيق العملي المتقدم والمشاريع التفاعلية',
        description: 'أمثلة برمجية وتطبيقية تفصيلية خطوة بخطوة بالشيفرات والبيانات الحية.',
        order: 2,
        lessons: [
          {
            id: 204,
            title: 'جلسة تطبيقية تفاعلية: معالجة البيانات وبناء النموذج الأول',
            lesson_type: 'video',
            duration_minutes: 35,
            order: 1,
            is_preview: false
          },
          {
            id: 205,
            title: 'الدليل المرجعي الشامل لأفضل الممارسات وحلول المشاكل الشائعة',
            lesson_type: 'pdf',
            duration_minutes: 20,
            order: 2,
            is_preview: false
          },
          {
            id: 206,
            title: 'تقييم الوحدة الثانية: اختبار شامل في هندسة وتطبيق الأنظمة',
            lesson_type: 'quiz',
            duration_minutes: 15,
            order: 3,
            is_preview: false
          },
          {
            id: 207,
            title: 'مشروع تقييم الزملاء: دراسة حالة واقعية وتصميم بنية النظام',
            lesson_type: 'peer_assignment',
            duration_minutes: 45,
            order: 4,
            is_preview: false
          }
        ]
      }
    ];

    return NextResponse.json(modules, { status: 200 });
  } catch (error) {
    console.error('Error fetching course syllabus:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
