import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { title: 'asc' }
    });

    const programs = courses.map(c => ({
      id: c.id,
      title: c.title,
      title_en: c.title,
      tuition_fee: c.price.toString(),
      currency: 'ر.س',
      provider_name: 'جامعة ليرنوف السحابية - LearnNov'
    }));

    return NextResponse.json(programs, { status: 200 });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
