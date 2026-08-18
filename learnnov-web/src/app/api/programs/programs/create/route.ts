import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRequest } from '@/lib/rbac';

export async function POST(request: Request) {
  try {
    const auth = await authorizeRequest(request, {
      requiredPermission: { action: 'create', resource: 'courses' }
    });

    if (!auth.authorized) {
      return auth.response!;
    }

    const payload = auth.user!;
    const body = await request.json();

    const {
      title,
      title_en,
      description,
      tuition_fee,
      duration_months,
      field_of_study,
      category,
      instructor,
      price,
      capacity,
      image
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'يرجى إدخال عنوان المقرر الدراسي' }, { status: 400 });
    }

    const courseCategory = category || (field_of_study === 1 ? 'هندسة الذكاء الاصطناعي والبيانات' : field_of_study === 2 ? 'هندسة البرمجيات' : field_of_study === 3 ? 'الأمن السيبراني' : 'إدارة الأعمال والتقنية');
    const coursePrice = typeof tuition_fee === 'number' ? tuition_fee : (parseFloat(tuition_fee) || price || 450);
    const courseCapacity = capacity || 30;
    const courseInstructor = instructor || payload.name || 'د. خالد بن محمد (محاضر)';

    const newCourse = await prisma.course.create({
      data: {
        title,
        category: courseCategory,
        instructor: courseInstructor,
        price: coursePrice,
        capacity: courseCapacity,
        enrolled_count: 0,
        image: image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
        description: description || title_en || 'مقرر دراسي أكاديمي متقدم معتمد عبر منصة ليرنوف السحابية.',
        startDate: new Date()
      }
    });

    await prisma.auditLog.create({
      data: {
        user: payload.name,
        action: 'إضافة مقرر دراسي جديد بقاعدة البيانات السحابية',
        resource: newCourse.title,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم إضافة المقرر الدراسي بنجاح في قاعدة البيانات السحابية',
      course: newCourse
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
