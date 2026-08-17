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

    // Fetch user enrollments and certificates
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        enrollments: { include: { course: true }, orderBy: { date: 'desc' } },
        certificates: { orderBy: { issueDate: 'desc' } }
      }
    });

    const notifications = [
      {
        id: 1,
        title: 'مرحباً بك في منصة ليرنوف الأكاديمية الذكية!',
        titleEn: 'Welcome to LearnNov Smart Academic Platform!',
        date: 'منذ ساعة',
        read: false,
        icon: '🚀',
        category: 'system'
      }
    ];

    if (user) {
      // Add notifications for approved enrollments
      user.enrollments.forEach((en, idx) => {
        if (en.status === 'approved') {
          notifications.push({
            id: 100 + idx,
            title: `تم قبول طلب التقديم والالتحاق بدورة: ${en.course.title}`,
            titleEn: `Enrollment approved for ${en.course.title}`,
            date: en.date.toISOString().split('T')[0],
            read: false,
            icon: '🎓',
            category: 'academic'
          });
        }
      });

      // Add notifications for issued certificates
      user.certificates.forEach((cert, idx) => {
        notifications.push({
          id: 200 + idx,
          title: `تم إصدار شهادتك الرقمية المعتمدة برمز ${cert.verifyCode} لدورة ${cert.courseTitle}`,
          titleEn: `Digital certificate ${cert.verifyCode} issued for ${cert.courseTitle}`,
          date: cert.issueDate.toISOString().split('T')[0],
          read: true,
          icon: '📜',
          category: 'certificate'
        });
      });
    }

    // Add Live Lecture reminder
    notifications.push({
      id: 999,
      title: 'تذكير: محاضرة البث المباشر عبر Google Meet تبدأ غداً الساعة 8 مساءً',
      titleEn: 'Reminder: Live Stream Lecture via Google Meet Tomorrow at 8 PM',
      date: 'منذ يوم',
      read: true,
      icon: '📹',
      category: 'academic'
    });

    return NextResponse.json(notifications, { status: 200 });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
