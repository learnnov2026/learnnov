import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const defaultTickets = [
  {
    id: 'TCK-89201',
    user: 'م. أحمد العتيبي',
    email: 'student@learnnov.com',
    type: 'academic',
    subject: 'استفسار بخصوص تقييم مشروع التخرج العملي',
    message: 'أود الاستفسار عن المعايير التفصيلية المعتمدة لتقييم كود المشروع النهائي للذكاء الاصطناعي.',
    status: 'open',
    priority: 'high',
    createdAt: '2026-08-16 09:30'
  },
  {
    id: 'TCK-89202',
    user: 'فاطمة الزهراء',
    email: 'fatima@learnnov.com',
    type: 'billing',
    subject: 'طلب فاتورة ضريبية إلكترونية لدورة الأمن السيبراني',
    message: 'يرجى تزويدي بنسخة رسمية من الفاتورة الضريبية متضمنة الرقم الضريبي للشركة.',
    status: 'resolved',
    priority: 'normal',
    createdAt: '2026-08-15 14:15'
  },
  {
    id: 'TCK-89203',
    user: 'سعد القحطاني',
    email: 'saad@learnnov.com',
    type: 'technical',
    subject: 'مشكلة في تحميل شهادة التخرج بصيغة PDF',
    message: 'عند الضغط على زر التحميل يظهر خطأ في التشفير الرقمي.',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2026-08-16 10:45'
  }
];

export async function GET(request: Request) {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'support_tickets' }
    });

    const tickets = setting ? JSON.parse(setting.value) : defaultTickets;
    return NextResponse.json(tickets, { status: 200 });
  } catch (error) {
    return NextResponse.json(defaultTickets, { status: 200 });
  }
}
