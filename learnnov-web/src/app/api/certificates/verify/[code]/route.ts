import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ error: 'Missing certificate code' }, { status: 400 });
    }

    const cleanCode = code.trim();

    // Check by verifyCode (exact, uppercase, or trimmed) or by UUID id
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verifyCode: cleanCode },
          { verifyCode: cleanCode.toUpperCase() },
          { id: cleanCode }
        ]
      },
      include: { user: true }
    });

    if (!cert) {
      return NextResponse.json({ 
        is_valid: false, 
        error: 'لم يتم العثور على وثيقة معتمدة بهذا الرمز في سجلات الجامعة السحابية.' 
      }, { status: 404 });
    }

    return NextResponse.json({
      is_valid: true,
      is_specialization: cert.is_specialization,
      student_name: cert.user?.name || 'طالب ليرنوف المعتمد',
      course_title: cert.courseTitle,
      specialization_title: cert.is_specialization ? cert.courseTitle : undefined,
      provider_name: 'جامعة ليرنوف السحابية للذكاء الاصطناعي',
      date_earned: cert.issueDate.toISOString().split('T')[0],
      verify_uuid: cert.verifyCode,
      grade: cert.grade
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
