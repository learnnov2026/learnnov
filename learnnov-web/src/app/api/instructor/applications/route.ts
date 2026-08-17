import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const defaultApps = [
  {
    id: '1',
    name: 'د. طارق السويدان',
    email: 'tariq.s@example.com',
    specialization: 'الذكاء الاصطناعي التوليدي والـ LLMs',
    experienceYears: 8,
    status: 'pending',
    bio: 'حاصل على دكتوراه في هندسة البيانات وباحث معتمد في نماذج اللغة وتطبيقات الذكاء الاصطناعي.',
    appliedAt: '2026-08-15'
  },
  {
    id: '2',
    name: 'م. ريم الشمري',
    email: 'reem.sh@example.com',
    specialization: 'الأمن السيبراني واختبار الاختراق الأخلاقي',
    experienceYears: 5,
    status: 'pending',
    bio: 'مستشارة أمن معلومات معتمدة CISSP ولديها خبرة في تدريب الكوادر على التصدي للهجمات.',
    appliedAt: '2026-08-16'
  }
];

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'instructor' && payload.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: true,
        course: true
      },
      orderBy: { date: 'desc' }
    });

    const applications = enrollments.map(e => ({
      id: e.id,
      full_name: e.user.name,
      email: e.user.email,
      program_title: e.course.title,
      status: e.status, // 'pending' | 'approved' | 'rejected'
      payment_status: e.payment_status,
      submitted_at: e.date.toISOString().split('T')[0]
    }));

    return NextResponse.json(applications, { status: 200 });
  } catch (error) {
    console.error('Error fetching instructor applications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    let applicantName = '';
    let applicantEmail = '';

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        applicantName = payload.name;
        applicantEmail = payload.email;
      }
    }

    const body = await request.json();
    const { name, email, specialization, experienceYears, bio } = body;

    const finalName = name || applicantName;
    const finalEmail = email || applicantEmail;

    if (!finalName || !finalEmail || !specialization) {
      return NextResponse.json({ error: 'يرجى إكمال جميع الحقول المطلوبة' }, { status: 400 });
    }

    const newApp = {
      id: String(Date.now()),
      name: finalName,
      email: finalEmail.toLowerCase(),
      specialization,
      experienceYears: Number(experienceYears) || 3,
      status: 'pending',
      bio: bio || 'طلب انضمام لهيئة التدريس لتقديم برامج تدريبية متقدمة في المنصة.',
      appliedAt: new Date().toISOString().split('T')[0]
    };

    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'instructor_applications' }
    });

    const appsList = setting ? JSON.parse(setting.value) : defaultApps;
    const updatedApps = [newApp, ...appsList];

    await prisma.systemSettings.upsert({
      where: { key: 'instructor_applications' },
      update: { value: JSON.stringify(updatedApps) },
      create: { key: 'instructor_applications', value: JSON.stringify(updatedApps) }
    });

    await prisma.auditLog.create({
      data: {
        user: finalName,
        action: 'تقديم طلب انضمام لهيئة التدريس',
        resource: specialization,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم استلام طلب الانضمام لهيئة التدريس بنجاح وسيتم مراجعته من قبل إدارة الجامعة.',
      application: newApp
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting instructor application:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
