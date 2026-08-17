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

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const token = cookies['learnnov_session'];

    let userName = 'زائر';
    let userEmail = 'guest@learnnov.com';

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userName = payload.name;
        userEmail = payload.email || 'student@learnnov.com';
      }
    }

    const body = await request.json();
    const { subject, message, type, priority, email, name } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 });
    }

    const finalName = name || userName;
    const finalEmail = email || userEmail;
    const ticketId = `TCK-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTicket = {
      id: ticketId,
      user: finalName,
      email: finalEmail,
      type: type || 'technical',
      subject,
      message,
      status: 'open',
      priority: priority || 'high',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    // Save to SystemSettings so Admin immediately sees this ticket in Admin Panel
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'support_tickets' }
    });

    const ticketsList = setting ? JSON.parse(setting.value) : defaultTickets;
    const updatedTickets = [newTicket, ...ticketsList];

    await prisma.systemSettings.upsert({
      where: { key: 'support_tickets' },
      update: { value: JSON.stringify(updatedTickets) },
      create: { key: 'support_tickets', value: JSON.stringify(updatedTickets) }
    });

    // Log the support ticket into AuditLog table
    await prisma.auditLog.create({
      data: {
        user: finalName,
        action: `إرسال تذكرة دعم [${type || 'technical'}]`,
        resource: `${ticketId}: ${subject}`,
        ip: '127.0.0.1',
        severity: 'info'
      }
    });

    return NextResponse.json({
      success: true,
      ticketId,
      ticket: newTicket,
      message: 'تم استلام تذكرتك بنجاح، سيقوم الفريق الأكاديمي والتقني بالرد عليك قريباً.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting support ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
