import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];
    let currentUserId: string | null = null;

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId) {
        currentUserId = payload.userId;
      }
    }

    const courses = await prisma.course.findMany({
      orderBy: { price: 'asc' }
    });

    let isEnrolled = false;
    let certUuid: string | null = null;

    if (currentUserId) {
      const userEnrollment = await prisma.enrollment.findFirst({
        where: { userId: currentUserId }
      });
      if (userEnrollment) isEnrolled = true;

      const userCert = await prisma.certificate.findFirst({
        where: { userId: currentUserId }
      });
      if (userCert) certUuid = userCert.verifyCode;
    }

    const specDetail = {
      id: 1,
      title: "التخصص المهني في هندسة الذكاء الاصطناعي وتطبيقات الويب",
      title_en: "Professional Specialization in AI & Fullstack Web Engineering",
      slug: slug || "master-ai-specialization",
      description: "مسار أكاديمي مهني شامل يدمج هندسة الأوامر والنماذج التوليدية مع معمارية الويب الحديثة Next.js 16 لحل التحديات التقنية الواقعية.",
      cover_image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      provider_name: "جامعة ليرنوف السحابية - LearnNov",
      provider_logo: null,
      courses: courses.map(c => ({
        id: c.id,
        title: c.title,
        title_en: c.title,
        slug: c.id,
        degree_level_display: "دبلوم مهني معتمد",
        study_mode_display: "عن بُعد بالكامل",
        tuition_fee: c.price.toString(),
        currency: "SAR"
      })),
      is_enrolled: isEnrolled,
      progress_percentage: isEnrolled ? 65 : 0,
      is_completed: !!certUuid,
      certificate_uuid: certUuid
    };

    return NextResponse.json(specDetail, { status: 200 });

  } catch (error) {
    console.error('Error fetching specialization detail:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
