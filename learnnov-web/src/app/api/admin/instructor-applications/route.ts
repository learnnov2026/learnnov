import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const defaultInstructorApps = [
  {
    id: 'INS-APP-101',
    userId: '3',
    applicantName: 'د. طارق الحازمي',
    email: 'tareq@learnnov.com',
    specialization: 'علوم البيانات وتعلم الآلة',
    experienceYears: 8,
    bio: 'دكتوراه في الذكاء الاصطناعي مع خبرة تدريس جامعي وإشراف على مشاريع تحول رقمي.',
    status: 'pending',
    appliedAt: '2026-08-15'
  },
  {
    id: 'INS-APP-102',
    userId: '4',
    applicantName: 'أ. ريم الشمري',
    email: 'reem@learnnov.com',
    specialization: 'تصميم واجهات وتجربة المستخدم UX/UI',
    experienceYears: 5,
    bio: 'مصممة أولى بخبرة في منتجات FinTech والتصميم التفاعلي.',
    status: 'approved',
    appliedAt: '2026-08-11'
  }
];

export async function GET(request: Request) {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'instructor_applications' }
    });

    const apps = setting ? JSON.parse(setting.value) : defaultInstructorApps;
    return NextResponse.json(apps, { status: 200 });
  } catch (error) {
    return NextResponse.json(defaultInstructorApps, { status: 200 });
  }
}
