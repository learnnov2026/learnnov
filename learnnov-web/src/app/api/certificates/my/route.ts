import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const certificates = await prisma.certificate.findMany({
      where: { userId: payload.userId },
      include: { user: true },
      orderBy: { issueDate: 'desc' }
    });

    const formatted = certificates.map(c => ({
      id: c.id,
      course_title: c.courseTitle,
      provider_name: 'جامعة ليرنوف السحابية للذكاء الاصطناعي',
      student_name: c.user.name,
      grade: c.grade,
      date_earned: c.issueDate.toISOString().split('T')[0],
      verify_uuid: c.verifyCode,
      qr_image_url: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://learnnov-web.vercel.app/verify/${c.verifyCode}`,
      verification_url: `https://learnnov-web.vercel.app/verify/${c.verifyCode}`,
      is_specialization: c.is_specialization,
      signatories: [
        { name: 'د. خالد بن محمد', title: 'عميد كلية الذكاء الاصطناعي', organization: 'LearnNov University' },
        { name: 'د. سارة الأحمد', title: 'رئيس مجلس الاعتماد الأكاديمي', organization: 'LearnNov Global' }
      ]
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
