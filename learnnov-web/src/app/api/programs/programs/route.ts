import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const programs = courses.map(c => ({
      id: c.id,
      title: c.title,
      title_en: c.title,
      slug: c.id,
      provider_name: c.instructor || 'جامعة ليرنوف السحابية للذكاء الاصطناعي',
      provider_logo: null,
      field_name: c.category || 'هندسة البرمجيات والذكاء الاصطناعي',
      degree_level: 'diploma',
      degree_level_display: 'دبلوم تخصصي معتمد',
      study_mode: 'online',
      study_mode_display: 'عن بُعد بالكامل',
      language: 'ar',
      duration_months: 4,
      tuition_fee: c.price,
      currency: 'ر.س',
      scholarship_available: true,
      is_open: true,
      image: c.image,
      description: c.description,
      enrolled_count: c.enrolled_count,
      capacity: c.capacity
    }));

    return NextResponse.json(programs, { status: 200 });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
